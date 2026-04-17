import express from "express";
import AppointmentRequest from "../models/AppointmentRequest.js";
import { publishEvent } from "../services/rabbitmqPublisher.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// GET /api/appointments/details/:id — single appointment lookup (fallback when appointment-service is down)
router.get("/details/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const request = await AppointmentRequest.findOne({
      $or: [{ mongoId: id }, { appointmentId: id }],
    }).lean();
    if (!request) return res.status(404).json({ error: "Appointment not found" });
    res.set("X-Data-Source", "doctor-service-snapshot");
    res.set("X-Cache", "STALE");
    // Match appointment-service response shape: { appointment: {...} }
    res.json({ appointment: request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/appointments/doctor/:doctorId — all appointments (schedule fallback)
// Returns plain array — same shape as appointment-service response
router.get("/doctor/:doctorId", verifyToken, allowRoles("doctor"), async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (req.user.roleId !== doctorId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    const requests = await AppointmentRequest.find({ doctorId }).sort({ createdAt: -1 }).lean();
    res.set("X-Data-Source", "doctor-service-snapshot");
    res.set("X-Cache", "STALE");
    res.json(requests);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/appointments/doctor/:doctorId/consultations — CONFIRMED + PAID only (consultations fallback)
// Used by the gateway when appointment-service is down so the Consultations page still works
router.get("/doctor/:doctorId/consultations", verifyToken, allowRoles("doctor"), async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (req.user.roleId !== doctorId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    const requests = await AppointmentRequest.find({
      doctorId,
      status: "CONFIRMED",
      paymentStatus: "PAID",
    }).sort({ date: -1 }).lean();
    res.set("X-Data-Source", "doctor-service-snapshot");
    res.set("X-Cache", "STALE");
    res.json(requests);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/appointments/:id/confirm
router.put("/:id/confirm", verifyToken, allowRoles("doctor"), async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const doctorId = req.user.roleId;

    const request = await AppointmentRequest.findOne({
      $or: [{ mongoId: appointmentId }, { appointmentId }],
    });

    if (!request) {
      return res.status(404).json({ success: false, message: "Appointment request not found" });
    }
    if (request.doctorId !== doctorId) {
      return res.status(403).json({ success: false, message: "Not your appointment" });
    }
    if (request.status === "CANCELLED") {
      return res.status(400).json({ success: false, message: "Cannot confirm a cancelled appointment" });
    }
    if (request.status === "CONFIRMED") {
      return res.status(200).json({ success: true, message: "Already confirmed", data: request });
    }

    // Update local snapshot immediately
    request.status = "CONFIRMED";
    request.syncedAt = new Date();
    await request.save();

    // Publish command event — appointment-service will process this when it's up
    try {
      await publishEvent("appointments", "appointment.doctor_confirmed", {
        appointmentId: request.appointmentId,
        mongoId:       request.mongoId,
        doctorId,
        status:        "CONFIRMED",
        rejectionReason: null,
        timestamp:     new Date().toISOString(),
      });
    } catch (mqErr) {
      console.warn("⚠️ [doctor-svc] Failed to publish doctor_confirmed event:", mqErr.message);
      // Still return 200 — local snapshot is updated, RabbitMQ will retry
    }

    res.json({ success: true, message: "Appointment confirmed", data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/appointments/:id/reject
router.put("/:id/reject", verifyToken, allowRoles("doctor"), async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const doctorId = req.user.roleId;
    const reason = req.body?.reason || "Rejected by doctor";

    const request = await AppointmentRequest.findOne({
      $or: [{ mongoId: appointmentId }, { appointmentId }],
    });

    if (!request) {
      return res.status(404).json({ success: false, message: "Appointment request not found" });
    }
    if (request.doctorId !== doctorId) {
      return res.status(403).json({ success: false, message: "Not your appointment" });
    }
    if (request.status === "COMPLETED") {
      return res.status(400).json({ success: false, message: "Cannot reject a completed appointment" });
    }
    if (request.status === "CANCELLED") {
      return res.status(200).json({ success: true, message: "Already cancelled", data: request });
    }

    // Update local snapshot immediately
    request.status = "CANCELLED";
    request.rejectionReason = reason;
    request.syncedAt = new Date();
    await request.save();

    // Publish command event — appointment-service will process this when it's up
    try {
      await publishEvent("appointments", "appointment.doctor_rejected", {
        appointmentId: request.appointmentId,
        mongoId:       request.mongoId,
        doctorId,
        status:        "CANCELLED",
        rejectionReason: reason,
        timestamp:     new Date().toISOString(),
      });
    } catch (mqErr) {
      console.warn("⚠️ [doctor-svc] Failed to publish doctor_rejected event:", mqErr.message);
    }

    res.json({ success: true, message: "Appointment rejected", data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
