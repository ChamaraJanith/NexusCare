import express from "express";
import axios from "axios";
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
import Appointment from "../models/Appointment.js";

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:5006";
const VIDEO_SERVICE_URL = process.env.VIDEO_SERVICE_URL || "http://video-session-integration-service:5012";
const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY;

const sendNotificationEmail = async ({ email, subject, message }) => {
  if (!email) return false;

  try {
    const response = await axios.post(
      `${NOTIFICATION_SERVICE_URL}/api/notifications/send`,
      { email, subject, message },
      {
        headers: { "x-internal-service-key": INTERNAL_SERVICE_KEY },
        timeout: 5000,
      }
    );

    console.log(`📩 Appointment-service email send response for ${email}:`, response.data);
    return response.data?.success === true;
  } catch (err) {
    console.error("❌ Appointment-service failed to send notification email:", err.response?.data || err.message || err);
    return false;
  }
};

const ensureVideoSession = async (appointment) => {
  if (!appointment) return null;
  if (appointment.appointmentType !== "ONLINE") return appointment;
  if (appointment.status !== "CONFIRMED") return appointment;
  if (appointment.paymentStatus !== "PAID") return appointment;
  if (appointment.videoRoomId && appointment.videoRoomUrl) return appointment;

  try {
    const response = await axios.post(
      `${VIDEO_SERVICE_URL}/api/video/initialize-link`,
      {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentId: appointment._id,
        patientEmail: appointment.email || '',
        doctorEmail: appointment.doctorEmail || '',
        patientPhone: appointment.phone || '',
      },
      {
        headers: { "x-internal-service-key": INTERNAL_SERVICE_KEY },
        timeout: 7000,
      }
    );

    const session = response.data?.data;
    if (session?.roomId && session?.roomUrl) {
      return await Appointment.findByIdAndUpdate(
        appointment._id,
        {
          videoRoomId: session.roomId,
          videoRoomUrl: session.roomUrl,
        },
        { new: true }
      );
    }
  } catch (err) {
    console.warn("⚠️ Failed to ensure video session:", err.response?.data || err.message || err);
  }

  return appointment;
};

const router = express.Router();


// 🔍 SEARCH DOCTORS
router.get("/search", async (req, res) => {
  try {
    const { name, specialization, hospital, location, date } = req.query;

    const doctors = await doctorService.searchDoctors({
      name,
      specialization,
      hospital,
      location,
      date
    });

    res.json(doctors);

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    res.status(500).json({ error: "Failed to fetch doctors" });
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
    const appointment = await Appointment.findById(req.params.id);
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

    if (updated?.email) {
      await sendNotificationEmail({
        email: updated.email,
        subject: "NexusCare Appointment Confirmed",
        message: `Hello ${updated.patientName || 'Patient'},\n\nYour appointment scheduled on ${updated.date} at ${updated.time} has been confirmed by Dr. ${updated.doctorId}.\n\nThank you for using NexusCare.`,
      });
    } else {
      console.warn("⚠️ Appointment confirmed but no patient email was available to send notification");
    }

    if (updated.paymentStatus === "PAID" && updated.appointmentType === "ONLINE") {
      await ensureVideoSession(updated);
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

    if (updated?.email) {
      await sendNotificationEmail({
        email: updated.email,
        subject: "NexusCare Appointment Rejected",
        message: `Hello ${updated.patientName || 'Patient'},\n\nYour appointment scheduled on ${updated.date} at ${updated.time} has been rejected by the doctor.\n\nReason: ${reason || 'Rejected by doctor'}\n\nPlease book another appointment or contact NexusCare support.`,
      });
    } else {
      console.warn("⚠️ Appointment rejected but no patient email was available to send notification");
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
      await ensureVideoSession(updated);
    }

    res.json({ message: "Payment status updated", appointment: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;