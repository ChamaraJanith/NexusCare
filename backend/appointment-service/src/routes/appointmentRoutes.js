import express from "express";
import {
  bookAppointment,
  getAppointments,
  updateAppointment,
  cancelAppointment
} from "../controllers/appointmentController.js";

import {
  validateAppointment,
  validateUpdateAppointment
} from "../validators/appointmentValidator.js";

import * as doctorService from "../services/doctorService.js";
import { verifyUser } from "../services/authService.js";
import Appointment from "../models/Appointment.js";

const router = express.Router();


// 🔍 SEARCH DOCTORS
router.get("/search", async (req, res) => {
  try {
    const { name, specialty, hospital, date } = req.query;

    const doctors = await doctorService.searchDoctors({
      name,
      specialty,
      hospital,
      date
    });

    res.json(doctors);

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    res.status(500).json({ error: "Failed to fetch doctors" });
  }
});


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

export default router;