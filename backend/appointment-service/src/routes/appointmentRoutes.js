import express from "express";
import mongoose from "mongoose";
import {
  bookAppointment,
  getAppointments,
  getDoctorAppointments,
  updateAppointment,
  cancelAppointment,
  getNextQueue
} from "../controllers/appointmentController.js";

import {
  validateAppointment,
  validateUpdateAppointment
} from "../validators/appointmentValidator.js";

import * as doctorService from "../services/doctorService.js";
import { verifyUser } from "../services/authService.js";
import { publishEvent } from "../services/eventPublisher.js";
import Appointment from "../models/Appointment.js";

const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY;

const buildAppointmentEventPayload = (appointment) => ({
  appointmentId: appointment.appointmentId,
  id: appointment._id?.toString(),
  patientId: appointment.patientId,
  doctorId: appointment.doctorId,
  appointmentType: appointment.appointmentType,
  status: appointment.status,
  paymentStatus: appointment.paymentStatus,
  date: appointment.date,
  time: appointment.time,
  email: appointment.email,
  phone: appointment.phone,
  queueNumber: appointment.queueNumber,
  doctorName: appointment.doctorName,
  patientName: appointment.patientName,
  rejectionReason: appointment.rejectionReason,
});

const router = express.Router();


// 🔍 SEARCH DOCTORS
router.get("/search", async (req, res) => {
  try {
    const { name, specialization, hospital, location, date } = req.query;

    const result = await doctorService.searchDoctors({
      name,
      specialization,
      hospital,
      location,
      date
    });

    if (result.stale) {
      res.set("X-Cache", "STALE");
      res.set("X-Cache-Warning", "Doctor service unavailable — showing cached results");
    }

    res.json(result);

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message });
  }
});

// 🔥 Next available queue number
router.get("/queue/next", getNextQueue);

// 📅 GET DOCTOR SLOTS (🔥 FIXED - NO TOKEN NEEDED)
router.get("/doctor/:doctorId/slots", async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const slots = await doctorService.getDoctorSlots(
      doctorId,
      date
    );

    res.json(slots);

  } catch (err) {
    console.error("❌ SLOT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});


// 📝 BOOK APPOINTMENT
router.post("/", validateAppointment, bookAppointment);


// 📄 GET PATIENT APPOINTMENTS
router.get("/patient/:patientId", getAppointments);

// 👨‍⚕️ GET DOCTOR APPOINTMENTS
router.get("/doctor/:doctorId", getDoctorAppointments);

// 🕵️ GET APPOINTMENT DETAILS
router.get("/details/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = mongoose.isValidObjectId(id)
      ? { _id: id }
      : { appointmentId: id };

    const appointment = await Appointment.findOne(query);
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    res.json({ appointment });
  } catch (error) {
    console.error("❌ DETAILS ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✏️ UPDATE APPOINTMENT
router.put("/:id", validateUpdateAppointment, updateAppointment);


// ❌ CANCEL APPOINTMENT
router.delete("/:id", cancelAppointment);


// 👨‍💼 ADMIN VERIFY APPOINTMENT
router.put("/admin/verify/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const userData = await verifyUser(token);

    if (userData.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: "VERIFIED" },
      { new: true }
    );

    res.json(updated);

  } catch (error) {
    console.error("❌ ADMIN VERIFY ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ── NEW: Doctor confirm ──────────────────────────────────────────
router.put("/doctor/confirm/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });
    const userData = await verifyUser(token);
    if (userData.role !== "doctor") return res.status(403).json({ error: "Doctors only" });

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: "Not found" });
    if (appointment.doctorId !== userData.roleId) return res.status(403).json({ error: "Not your appointment" });
    if (appointment.status === "CANCELLED") return res.status(400).json({ error: "Cannot confirm cancelled appointment" });

    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: "CONFIRMED" },
      { new: true }
    );

    const { io } = await import("../app.js");
    io.emit("appointmentConfirmed", updated);

    try {
      await publishEvent("appointments", "appointment.confirmed", buildAppointmentEventPayload(updated));
    } catch (err) {
      console.warn("⚠️ Failed to publish appointment.confirmed event:", err.message || err);
    }

    if (updated.paymentStatus === "PAID" && updated.appointmentType === "ONLINE") {
      try {
        await publishEvent("appointments", "appointment.online_confirmed", buildAppointmentEventPayload(updated));
      } catch (err) {
        console.warn("⚠️ Failed to publish appointment.online_confirmed event:", err.message || err);
      }
    }

    res.json({ message: "Appointment confirmed", appointment: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── NEW: Doctor reject ───────────────────────────────────────────
router.put("/doctor/reject/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });
    const userData = await verifyUser(token);
    if (userData.role !== "doctor") return res.status(403).json({ error: "Doctors only" });

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: "Not found" });
    if (appointment.doctorId !== userData.roleId) return res.status(403).json({ error: "Not your appointment" });
    if (appointment.status === "COMPLETED") return res.status(400).json({ error: "Cannot reject completed appointment" });

    const { reason } = req.body;
    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: "CANCELLED", rejectionReason: reason || "Rejected by doctor" },
      { new: true }
    );

    const { io } = await import("../app.js");
    io.emit("appointmentRejected", updated);

    try {
      await publishEvent("appointments", "appointment.rejected", buildAppointmentEventPayload(updated));
    } catch (err) {
      console.warn("⚠️ Failed to publish appointment.rejected event:", err.message || err);
    }

    res.json({ message: "Appointment rejected", appointment: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── NEW: Mark complete ───────────────────────────────────────────
router.put("/doctor/complete/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });
    const userData = await verifyUser(token);
    if (userData.role !== "doctor") return res.status(403).json({ error: "Doctors only" });

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: "Not found" });
    if (appointment.doctorId !== userData.roleId) return res.status(403).json({ error: "Not your appointment" });

    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: "COMPLETED" },
      { new: true }
    );

    const { io } = await import("../app.js");
    io.emit("appointmentCompleted", updated);

    res.json({ message: "Marked as completed", appointment: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── NEW: Payment status update (called by payment-service webhook) ─
router.patch("/:id/payment", async (req, res) => {
  try {
    const internalKey = req.headers["x-internal-service-key"];
    const allowedKeys = [process.env.INTERNAL_SERVICE_KEY, process.env.INTERNAL_SERVICE_KEY_FALLBACK].filter(Boolean);
    if (!allowedKeys.includes(internalKey)) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const { paymentStatus } = req.body;
    const appointmentId = req.params.id;
    const updated = await Appointment.findOneAndUpdate(
      {
        $or: [
          { _id: appointmentId },
          { appointmentId }
        ]
      },
      { paymentStatus },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Appointment not found" });

    if (updated.paymentStatus === "PAID" && updated.status === "CONFIRMED" && updated.appointmentType === "ONLINE") {
      try {
        await publishEvent("appointments", "appointment.online_confirmed", buildAppointmentEventPayload(updated));
      } catch (err) {
        console.warn("⚠️ Failed to publish appointment.online_confirmed event:", err.message || err);
      }
    }

    res.json({ message: "Payment status updated", appointment: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;