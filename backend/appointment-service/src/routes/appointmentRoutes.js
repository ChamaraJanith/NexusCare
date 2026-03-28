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

// 🔥 ADD THIS (missing before)
import { verifyUser } from "../services/authService.js";
import Appointment from "../models/Appointment.js";

const router = express.Router();

router.get("/search", async (req, res) => {
  try {
    const { name, specialty, hospital, date } = req.query;

    const doctors = await doctorService.searchDoctors({
      name,
      specialty,
      hospital,
      date
    });

    console.log("🔥 DOCTORS:", doctors);

    // ✅ RETURN FULL ARRAY
    res.json(doctors);

  } catch (error) {
    console.error("❌ ERROR:", error.message);

    res.status(500).json({
      error: "Failed to fetch doctors"
    });
  }
});


// ✅ Book appointment
router.post("/", validateAppointment, bookAppointment);


// ✅ Get appointments
router.get("/patient/:patientId", getAppointments);


// ✅ Update appointment
router.put("/:id", validateUpdateAppointment, updateAppointment);


// ✅ Cancel appointment
router.delete("/:id", cancelAppointment);


// ✅ Admin verify appointment
router.put("/admin/verify/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const userData = await verifyUser(token);

    // 🔥 Only admin allowed
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
    res.status(500).json({ error: error.message });
  }
});

export default router;