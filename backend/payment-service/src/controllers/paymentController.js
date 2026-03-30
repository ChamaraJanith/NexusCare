const crypto = require("crypto");
const axios  = require("axios");                          // ✅ ADD THIS if not already there
const Payment = require("../models/Payment");
const { generateHash, verifyWebhookHash } = require("../config/payhere");

// ─── INITIATE PAYMENT ─────────────────────────────────────────────────────────
const initiatePayment = async (req, res, next) => {
  try {
    const {
      appointmentId, doctorId, doctorName,
      amount, patientName, patientEmail, patientPhone,
    } = req.body;

    if (!amount || !doctorId || !patientName || !patientEmail) {
      return res.status(400).json({
        success: false,
        message: "amount, doctorId, patientName, patientEmail are required.",
      });
    }

    // Remove "Dr." prefix to prevent "Dr. Dr. Silva"
    const cleanDoctorName = (doctorName || "Doctor").replace(/^Dr\.?\s*/i, "").trim();

    const orderId = `PAY-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const hash = generateHash(orderId, amount);

    const payment = await Payment.create({
      orderId,
      patientId: req.user.roleId,
      patientName, patientEmail,
      appointmentId, doctorId,
      doctorName: cleanDoctorName,
      amount,
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:9000";
    const selfUrl     = process.env.SELF_URL      || "http://localhost:5005";

    res.status(200).json({
      success: true,
      message: "Payment initiated.",
      data: {
        paymentId: payment._id,
        orderId,
        checkout: {
          merchant_id: process.env.PAYHERE_MERCHANT_ID,
          return_url:  `${frontendUrl}/payment?status=success&order_id=${orderId}`,
          cancel_url:  `${frontendUrl}/payment?status=cancel&order_id=${orderId}`,
          notify_url:  `${selfUrl}/api/payments/webhook`,
          order_id:    orderId,
          items:       `Consultation with Dr. ${cleanDoctorName}`,
          currency:    "LKR",
          amount:      parseFloat(amount).toFixed(2),
          first_name:  patientName.split(" ")[0],
          last_name:   patientName.split(" ").slice(1).join(" ") || ".",
          email:       patientEmail,
          phone:       patientPhone || "0771234567",
          address:     "Sri Lanka",
          city:        "Colombo",
          country:     "Sri Lanka",
          hash,
        },
        payhereUrl: process.env.PAYHERE_BASE_URL,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── PAYHERE WEBHOOK ──────────────────────────────────────────────────────────
const payhereWebhook = async (req, res, next) => {
  try {
    const { order_id, payment_id, status_code } = req.body;

    const isValid = verifyWebhookHash(req.body);
    if (!isValid) {
      console.error("❌ Webhook hash mismatch");
      return res.status(400).send("Hash mismatch");
    }

    const statusMap = {
      "2": "success", "0": "pending",
      "-1": "cancelled", "-2": "failed", "-3": "chargedback",
    };

    const newStatus = statusMap[String(status_code)] || "pending";

    const payment = await Payment.findOneAndUpdate(
      { orderId: order_id },
      { status: newStatus, payherePaymentId: payment_id, webhookData: req.body },
      { new: true }
    );

    if (!payment) return res.status(404).send("Order not found");

    console.log(`✅ Webhook: ${order_id} → ${newStatus}`);

    // ✅ NEW — notify appointment-service to mark PAID after successful payment
    if (newStatus === "success" && payment.appointmentId) {
      try {
        await axios.patch(
          `${process.env.APPOINTMENT_SERVICE_URL || "http://localhost:5003"}/api/appointments/${payment.appointmentId}/payment`,
          { paymentStatus: "PAID" },
          {
            headers: {
              "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY
            },
            timeout: 5000
          }
        );
        console.log(`✅ Appointment ${payment.appointmentId} marked as PAID`);
      } catch (notifyErr) {
        // Log but don't fail — if we return non-200, PayHere will keep retrying
        console.error("Failed to notify appointment service:", notifyErr.message);
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(200).send("OK");
  }
};

// ─── CONFIRM PAYMENT (called from return_url) ─────────────────────────────────
const confirmPayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId required." });
    }

    const payment = await Payment.findOne({ orderId }).select("-webhookData -__v");

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found." });
    }

    // Security: only the patient who initiated can confirm
    if (payment.patientId !== req.user.roleId) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    // If webhook already updated status, return current status
    if (payment.status !== "pending") {
      return res.status(200).json({ success: true, data: payment });
    }

    // Mark as success (PayHere redirects to return_url only on success)
    const updated = await Payment.findOneAndUpdate(
      { orderId, status: "pending" },
      { status: "success" },
      { new: true }
    ).select("-webhookData -__v");

    console.log(`✅ Payment confirmed via return_url: ${orderId}`);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── GET MY PAYMENTS (Patient) ────────────────────────────────────────────────
const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ patientId: req.user.roleId })
      .sort({ createdAt: -1 })
      .select("-webhookData -__v");
    res.status(200).json({ success: true, count: payments.length, data: payments });
  } catch (error) { next(error); }
};

// ─── GET PAYMENT STATUS ───────────────────────────────────────────────────────
const getPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const payment = await Payment.findOne({ orderId }).select("-webhookData -__v");

    if (!payment) return res.status(404).json({ success: false, message: "Payment not found." });
    if (req.user.role === "patient" && payment.patientId !== req.user.roleId) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    res.status(200).json({ success: true, data: payment });
  } catch (error) { next(error); }
};

// ─── GET ALL PAYMENTS (Admin) ─────────────────────────────────────────────────
const getAllPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total, stats] = await Promise.all([
      Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).select("-webhookData -__v"),
      Payment.countDocuments(filter),
      Payment.aggregate([
        { $match: { status: "success" } },
        { $group: { _id: null, totalRevenue: { $sum: "$amount" }, totalTransactions: { $sum: 1 } } },
      ]),
    ]);

    res.status(200).json({
      success: true, total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      financials: stats[0] || { totalRevenue: 0, totalTransactions: 0 },
      data: payments,
    });
  } catch (error) { next(error); }
};

// ─── GET PAYMENT STATS (Admin) ────────────────────────────────────────────────
const getPaymentStats = async (req, res, next) => {
  try {
    const [byStatus, recentRevenue] = await Promise.all([
      Payment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$amount" } } }]),
      Payment.aggregate([
        { $match: { status: "success" } },
        { $group: { _id: null, totalRevenue: { $sum: "$amount" }, totalTransactions: { $sum: 1 }, avgAmount: { $avg: "$amount" } } },
      ]),
    ]);

    const statusSummary = {};
    byStatus.forEach((s) => { statusSummary[s._id] = { count: s.count, total: s.total }; });

    res.status(200).json({
      success: true,
      data: {
        byStatus: statusSummary,
        revenue: recentRevenue[0] || { totalRevenue: 0, totalTransactions: 0, avgAmount: 0 },
      },
    });
  } catch (error) { next(error); }
};

module.exports = {
  initiatePayment,
  payhereWebhook,
  confirmPayment,
  getMyPayments,
  getPaymentStatus,
  getAllPayments,
  getPaymentStats,
};