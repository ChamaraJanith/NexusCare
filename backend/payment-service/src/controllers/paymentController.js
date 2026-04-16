const crypto = require("crypto");
const axios  = require("axios");                          // ✅ ADD THIS if not already there
const Payment = require("../models/Payment");
const { generateHash, verifyWebhookHash } = require("../config/payhere");
const { publishEvent } = require("../services/rabbitmqPublisher");

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5006";
const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || "http://localhost:5002";
const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || "http://localhost:5003";
const SELF_URL = process.env.SELF_URL || `http://localhost:${process.env.PORT || 5009}`;
const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY || process.env.INTERNAL_SERVICE_KEY_FALLBACK;

const getAppointmentServiceUrls = () => {
  return [
    process.env.APPOINTMENT_SERVICE_URL,
    process.env.API_GATEWAY_URL,
    "http://localhost:5003",
    "http://localhost:8080"
  ].filter(Boolean);
};

const publishPaymentEvent = async (routingKey,payload) => {
  try{
    await publishEvent("payments",routingKey, payload);
    console.log(`✅ Published event to RabbitMQ: payments.${routingKey}`);
  }catch(err){
    console.warn(`⚠️ Failed to publish event to RabbitMQ:`, err.message || err);
  }
};

const notifyAppointmentService = async (appointmentId, body) => {
  // 1. Update local AppointmentSnapshot immediately — this is what the fallback
  //    endpoint reads when appointment-service is down.
  try {
    const { updateSnapshotPaymentStatus } = require("../services/appointmentCache");
    const updated = await updateSnapshotPaymentStatus(appointmentId, body.paymentStatus);
    if (updated) {
      console.log(`✅ Local AppointmentSnapshot updated: ${appointmentId} → ${body.paymentStatus}`);
    } else {
      console.warn(`⚠️ AppointmentSnapshot not found for id: ${appointmentId} — snapshot may not exist yet`);
    }
  } catch (snapErr) {
    console.warn("⚠️ Failed to update local AppointmentSnapshot:", snapErr.message);
  }

  // 2. Publish to RabbitMQ — guaranteed delivery to appointment-service when it recovers.
  try {
    await publishEvent("payments", "payment.appointment_status_update", {
      appointmentId,
      ...body,
      timestamp: new Date().toISOString(),
    });
    console.log(`✅ Published payment.appointment_status_update for ${appointmentId}`);
  } catch (mqErr) {
    console.error("❌ RabbitMQ publish failed:", mqErr.message);
  }

  // 3. Best-effort HTTP — updates appointment-service immediately if it's up.
  const urls = getAppointmentServiceUrls();
  for (const baseUrl of urls) {
    try {
      const response = await axios.patch(
        `${baseUrl}/api/appointments/${appointmentId}/payment`,
        body,
        {
          headers: { "x-internal-service-key": INTERNAL_SERVICE_KEY },
          timeout: 5000
        }
      );
      console.log(`✅ Appointment ${appointmentId} marked as PAID via ${baseUrl}`);
      return response.data;
    } catch (err) {
      console.warn(`⚠️ HTTP notify failed at ${baseUrl}:`, err.response?.data || err.message);
    }
  }
};

const logNotificationEvent = async (data) => {
  try {
    await axios.post(
      `${NOTIFICATION_SERVICE_URL}/api/notifications/log`,
      data,
      {
        headers: { "x-internal-service-key": INTERNAL_SERVICE_KEY },
        timeout: 5000,
      }
    );
  } catch (err) {
    console.warn('⚠️ Notification log failed:', err.response?.data || err.message || err);
  }
};

const sendPaymentEmail = async ({ email, subject, message }) => {
  if (!email) {
    console.warn('⚠️ No email address available for payment notification');
    return false;
  }

  try {
    console.log(`📩 Payment-service requesting notification-service email send to ${email}`);
    const response = await axios.post(
      `${NOTIFICATION_SERVICE_URL}/api/notifications/send`,
      {
        email,
        subject,
        message,
      },
      {
        headers: { "x-internal-service-key": INTERNAL_SERVICE_KEY },
        timeout: 5000,
      }
    );
    console.log(`✅ Notification-service responded for ${email}:`, response.data);
    return response.data?.success === true;
  } catch (err) {
    console.warn('⚠️ Failed to send payment email:', err.response?.data || err.message || err);
    return false;
  }
};

const getDoctorContact = async (doctorId) => {
  try {
    const response = await axios.get(
      `${DOCTOR_SERVICE_URL}/api/doctors/internal/${doctorId}`,
      {
        headers: { "x-internal-service-key": INTERNAL_SERVICE_KEY },
        timeout: 5000,
      }
    );

    return response.data?.data || null;
  } catch (err) {
    console.warn('⚠️ Failed to resolve doctor contact:', err.response?.data || err.message || err);
    return null;
  }
};

// ─── INITIATE PAYMENT ─────────────────────────────────────────────────────────
const initiatePayment = async (req, res, next) => {
  try {
    const {
      appointmentId, doctorId, doctorName,
      amount, patientName, patientEmail, patientPhone,
      doctorFee, hospitalFee, serviceFee, hospitalId,
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
      patientName,
      patientEmail,
      patientPhone,
      appointmentId,
      doctorId,
      doctorName: cleanDoctorName,
      amount,
      hospitalId: hospitalId || null,
      charges: {
        doctorFee:   parseFloat(doctorFee)   || 0,
        hospitalFee: parseFloat(hospitalFee) || 0,
        serviceFee:  parseFloat(serviceFee)  || 0,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:9000";
    const selfUrl     = SELF_URL;

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

    await logNotificationEvent({
      type: 'payment',
      event: 'payment_status',
      status: newStatus === 'success' ? 'success' : newStatus === 'failed' || newStatus === 'cancelled' ? 'failed' : newStatus,
      appointmentId: payment.appointmentId,
      paymentId: payment._id?.toString(),
      patientId: payment.patientId,
      email: payment.patientEmail,
      message: `Payment ${newStatus} for order ${order_id}`,
      payload: { status_code, order_id, payment_id },
    });

    if (newStatus === 'success') {
      await publishPaymentEvent('payment.success', {
        paymentId: payment._id?.toString(),
        orderId: payment.orderId,
        appointmentId: payment.appointmentId,
        patientId: payment.patientId,
        doctorId: payment.doctorId,
        status: 'success',
        amount: payment.amount,
        patientEmail: payment.patientEmail,
        patientPhone: payment.patientPhone,
      });

      await sendPaymentEmail({
        email: payment.patientEmail,
        subject: 'NexusCare Payment Received',
        message: `Hello ${payment.patientName || 'Patient'},\n\nYour payment for appointment ${payment.appointmentId || ''} has been successfully received.\n\nThank you for using NexusCare.\n\nOrder: ${order_id}`,
      });

      const doctorContact = await getDoctorContact(payment.doctorId);
      if (doctorContact?.email && doctorContact.email !== payment.patientEmail) {
        await sendPaymentEmail({
          email: doctorContact.email,
          subject: 'NexusCare Payment Received for Your Patient',
          message: `Hello ${doctorContact.name || 'Doctor'},\n\nA payment has been completed for appointment ${payment.appointmentId || ''} with patient ${payment.patientName || 'Unknown patient'}.\n\nAmount: ${payment.amount} ${payment.currency}\n\nOrder: ${order_id}\n\nPlease review the appointment details in NexusCare.`,
        });
      }
    }

    // ✅ NEW — notify appointment-service to mark PAID after successful payment
    if (newStatus === "success" && payment.appointmentId) {
      try {
        await notifyAppointmentService(payment.appointmentId, { paymentStatus: "PAID" });
      } catch (notifyErr) {
        // Log but don't fail — if we return non-200, PayHere will keep retrying
        console.error("Failed to notify appointment service:", notifyErr.response?.data || notifyErr.message);
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(200).send("OK");
  }
};

// ─── CONFIRM PAYMENT (called from return_url) ─────────────────────────────────
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

    if (payment.patientId !== req.user.roleId) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    // If webhook already updated status, still notify appointment-service for PAYED appointments
    if (payment.status !== "pending") {
      if (payment.status === "success" && payment.appointmentId) {
        try {
          await notifyAppointmentService(payment.appointmentId, { paymentStatus: "PAID" });
          console.log(`✅ Appointment ${payment.appointmentId} marked as PAID via return_url (existing payment record)`);
        } catch (notifyErr) {
          console.error("Failed to notify appointment service for existing payment record:", notifyErr.response?.data || notifyErr.message);
        }
      }
      return res.status(200).json({ success: true, data: payment });
    }

    // Mark as success
    const updated = await Payment.findOneAndUpdate(
      { orderId, status: "pending" },
      { status: "success" },
      { new: true }
    ).select("-webhookData -__v");

    if (updated) {
      await publishPaymentEvent("payment.success", {
        paymentId: updated._id?.toString(),
        orderId: updated.orderId,
        appointmentId: updated.appointmentId,
        patientId: updated.patientId,
        doctorId: updated.doctorId,
        status: "success",
        amount: updated.amount,
        patientEmail: updated.patientEmail,
        patientPhone: updated.patientPhone,
      });

      await sendPaymentEmail({
        email: updated.patientEmail,
        subject: 'NexusCare Payment Confirmed',
        message: `Hello ${updated.patientName || 'Patient'},\n\nYour payment for appointment ${updated.appointmentId || ''} has been confirmed successfully.\n\nThank you for choosing NexusCare.\n\nOrder: ${orderId}`,
      });

      const doctorContact = await getDoctorContact(updated.doctorId);
      if (doctorContact?.email && doctorContact.email !== updated.patientEmail) {
        await sendPaymentEmail({
          email: doctorContact.email,
          subject: 'NexusCare Payment Received for Your Patient',
          message: `Hello ${doctorContact.name || 'Doctor'},\n\nA payment has been confirmed for appointment ${updated.appointmentId || ''} with patient ${updated.patientName || 'Unknown patient'}.\n\nAmount: ${updated.amount} ${updated.currency}\n\nOrder: ${orderId}\n\nPlease review your appointment in NexusCare.`,
        });
      }
    }

    console.log(`✅ Payment confirmed via return_url: ${orderId}`);

    // 🔥 ADD THIS — notify appointment-service to mark PAID
    // (webhook can't reach localhost in sandbox, so we do it here too)
    if (updated && updated.appointmentId) {
      try {
        await notifyAppointmentService(updated.appointmentId, { paymentStatus: "PAID" });
      } catch (notifyErr) {
        console.error("Failed to notify appointment service:", notifyErr.response?.data || notifyErr.message);
        // Don't fail the response — payment is confirmed, appointment update is best-effort
      }
    }

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

// ─── GET PATIENT APPOINTMENTS FALLBACK ───────────────────────────────────────
// Called by API gateway when appointment-service is down.
// Strategy (real-world pattern — payment-service owns payment truth):
// 1. Get all snapshots for this patient (from RabbitMQ-synced read-replica)
// 2. Get all payments for this patient from Payment collection (authoritative)
// 3. Merge: override paymentStatus on snapshots using Payment records
// 4. For appointments that have a Payment but NO snapshot, synthesize a minimal
//    record from the Payment data so the patient can always see their paid appointments
const getPatientAppointmentsFallback = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    if (req.user.role === "patient" && req.user.roleId !== patientId) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const { getPatientSnapshots } = require("../services/appointmentCache");

    // Run both queries in parallel
    const [snapshots, allPatientPayments] = await Promise.all([
      getPatientSnapshots(patientId),
      Payment.find({ patientId }).sort({ createdAt: -1 }).lean(),
    ]);

    console.log(`[fallback] patientId=${patientId} snapshots=${snapshots.length} payments=${allPatientPayments.length}`);
    console.log(`[fallback] payments:`, allPatientPayments.map(p => ({ id: p._id, appointmentId: p.appointmentId, status: p.status })));
    console.log(`[fallback] snapshots:`, snapshots.map(s => ({ appointmentId: s.appointmentId, mongoId: s.mongoId, paymentStatus: s.paymentStatus })));

    // Build a map of appointmentId → payment for fast lookup
    // Payment.appointmentId is the MongoDB _id of the appointment
    const paymentByAppointmentId = {};
    allPatientPayments.forEach((p) => {
      if (p.appointmentId) {
        // Keep the most recent successful payment, or any payment if no success
        const existing = paymentByAppointmentId[p.appointmentId];
        if (!existing || p.status === "success") {
          paymentByAppointmentId[p.appointmentId] = p;
        }
      }
    });

    // Step 1: Enrich snapshots with authoritative paymentStatus from Payment collection
    // Snapshot.mongoId = MongoDB _id = Payment.appointmentId
    const enrichedSnapshots = snapshots.map((s) => {
      const payment = paymentByAppointmentId[s.mongoId] || paymentByAppointmentId[s.appointmentId];
      const isPaid = payment && payment.status === "success";
      return {
        ...s,
        // Expose _id as mongoId so MyAppointments.vue can use appt._id correctly
        _id: s.mongoId || s.appointmentId,
        paymentStatus: isPaid ? "PAID" : (s.paymentStatus || "PENDING"),
      };
    });

    // Step 2: Find payments that have NO snapshot (appointment booked before consumer started)
    // These are appointments the patient paid for but we have no snapshot of
    const snapshotMongoIds = new Set(snapshots.map((s) => s.mongoId).filter(Boolean));
    const snapshotAppointmentIds = new Set(snapshots.map((s) => s.appointmentId).filter(Boolean));

    const orphanPayments = allPatientPayments.filter((p) => {
      if (!p.appointmentId) return false;
      return !snapshotMongoIds.has(p.appointmentId) && !snapshotAppointmentIds.has(p.appointmentId);
    });

    // Synthesize minimal appointment records from orphan payments
    const synthesized = orphanPayments.map((p) => ({
      _id: p.appointmentId,
      appointmentId: p.appointmentId,
      mongoId: p.appointmentId,
      patientId,
      doctorId: p.doctorId || "",
      doctorName: p.doctorName || "",
      patientName: p.patientName || "",
      date: "",
      time: "",
      appointmentType: "PHYSICAL",
      status: "CONFIRMED",
      paymentStatus: p.status === "success" ? "PAID" : "PENDING",
      charges: { total: p.amount || 0, doctorFee: 0, hospitalFee: 0, serviceFee: 0 },
      _synthesized: true,
    }));

    const result = [...enrichedSnapshots, ...synthesized];

    res.set("X-Data-Source", "payment-service-snapshot");
    res.set("X-Cache", "STALE");
    res.status(200).json(result);
  } catch (error) { next(error); }
};

// ─── GET REVENUE REPORT (Admin) ───────────────────────────────────────────────
const getRevenueReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const FEE_SERVICE_URL = process.env.FEE_SERVICE_URL || "http://localhost:5007";
    const APPOINTMENT_SERVICE_URL_LOCAL = process.env.APPOINTMENT_SERVICE_URL || "http://localhost:5003";

    const dateFilter = { status: "success" };
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from);
      if (to)   dateFilter.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
    }

    // Run payment aggregations + external calls in parallel
    const [systemRevenue, byDoctor, byMonth, totalPayments, hospitalsRes, appointmentsRes] = await Promise.all([
      // 1. Overall summary
      Payment.aggregate([
        { $match: dateFilter },
        { $group: {
          _id: null,
          totalRevenue:       { $sum: "$amount" },
          totalTransactions:  { $sum: 1 },
          avgAmount:          { $avg: "$amount" },
          serviceFeeRevenue:  { $sum: { $ifNull: ["$charges.serviceFee",  0] } },
          doctorFeeRevenue:   { $sum: { $ifNull: ["$charges.doctorFee",   0] } },
          hospitalFeeRevenue: { $sum: { $ifNull: ["$charges.hospitalFee", 0] } },
        }},
      ]),

      // 2. Doctor income — use charges.doctorFee if available, else fall back to full amount
      Payment.aggregate([
        { $match: dateFilter },
        { $group: {
          _id:          "$doctorId",
          doctorName:   { $first: "$doctorName" },
          totalIncome:  { $sum: { $ifNull: ["$charges.doctorFee", "$amount"] } },
          transactions: { $sum: 1 },
          lastPayment:  { $max: "$createdAt" },
        }},
        { $sort: { totalIncome: -1 } },
      ]),

      // 3. Monthly trend
      Payment.aggregate([
        { $match: { status: "success" } },
        { $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue:      { $sum: "$amount" },
          transactions: { $sum: 1 },
        }},
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        { $limit: 12 },
      ]),

      // 4. By status
      Payment.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$amount" } } },
      ]),

      // 5. Hospital master list
      axios.get(`${FEE_SERVICE_URL}/api/hospitals`, { timeout: 5000 })
        .catch(() => ({ data: { data: [] } })),

      // 6. Paid appointments from appointment-service (for hospital revenue)
      axios.get(`${APPOINTMENT_SERVICE_URL_LOCAL}/api/appointments/admin/all`, {
        headers: { "Authorization": req.headers.authorization || "" },
        params: { paymentStatus: "PAID", limit: 2000 },
        timeout: 8000,
      }).catch(() => ({ data: { data: [] } })),
    ]);

    // Build hospital name lookup from fee-service — index by BOTH hospitalId and _id
    const hospitals = hospitalsRes?.data?.data || [];
    const hospitalMap = {};
    hospitals.forEach(h => {
      if (h.hospitalId) hospitalMap[h.hospitalId] = h;
      if (h._id)        hospitalMap[h._id.toString()] = h;
    });

    // Build hospital revenue from appointment records using doctorHospital name
    // (hospitalId in appointments may be MongoDB _id or HOSP-XXXX — use name as reliable key)
    const hospitalRevenueMap = {};
    const appointments = appointmentsRes?.data?.data || [];

    // Build name→hospital lookup for display
    const hospitalByName = {};
    hospitals.forEach(h => { hospitalByName[h.name.toLowerCase()] = h; });

    appointments.forEach(appt => {
      const hFee = appt.charges?.hospitalFee || 0;
      if (hFee <= 0) return;

      // Use doctorHospital (name) as the grouping key — most reliable field
      const hName = appt.doctorHospital || "";
      if (!hName) return;

      const key = hName.toLowerCase();
      if (!hospitalRevenueMap[key]) {
        // Try to find matching hospital in fee-service list by name
        const matched = hospitalByName[key];
        hospitalRevenueMap[key] = {
          hospitalId:   matched?.hospitalId || appt.hospitalId || key,
          hospitalName: matched?.name || hName,
          location:     matched?.location || "",
          revenue:      0,
          appointments: 0,
        };
      }
      hospitalRevenueMap[key].revenue      += hFee;
      hospitalRevenueMap[key].appointments += 1;
    });

    // Merge with hospital master list (show all hospitals, even with 0 revenue)
    const hospitalRevenue = Object.values(hospitalRevenueMap);
    const usedNames = new Set(Object.keys(hospitalRevenueMap));
    hospitals.forEach(h => {
      if (!usedNames.has(h.name.toLowerCase())) {
        hospitalRevenue.push({
          hospitalId:   h.hospitalId,
          hospitalName: h.name,
          location:     h.location || "",
          revenue:      0,
          appointments: 0,
        });
      }
    });
    hospitalRevenue.sort((a, b) => b.revenue - a.revenue);

    // Status map
    const statusMap = {};
    totalPayments.forEach(s => { statusMap[s._id] = { count: s.count, total: s.total }; });

    // Monthly trend
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthlyTrend = byMonth.map(m => ({
      label: `${monthNames[m._id.month - 1]} ${m._id.year}`,
      revenue: m.revenue,
      transactions: m.transactions,
    }));

    const summary = systemRevenue[0] || {};
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue:       summary.totalRevenue       || 0,
          totalTransactions:  summary.totalTransactions  || 0,
          avgAmount:          summary.avgAmount          || 0,
          serviceFeeRevenue:  summary.serviceFeeRevenue  || 0,
          doctorFeeRevenue:   summary.doctorFeeRevenue   || 0,
          hospitalFeeRevenue: summary.hospitalFeeRevenue || 0,
        },
        byDoctor: byDoctor.map(d => ({
          doctorId:     d._id,
          doctorName:   d.doctorName || d._id,
          totalIncome:  d.totalIncome,
          transactions: d.transactions,
          lastPayment:  d.lastPayment,
        })),
        byHospital: hospitalRevenue,
        monthlyTrend,
        byStatus: statusMap,
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
  getRevenueReport,
  getPatientAppointmentsFallback,
};