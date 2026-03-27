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

const router = express.Router();

// ✅ Search doctors FIRST
router.get("/search/:specialty", async (req, res) => {
  try {
    const doctors = await doctorService.searchDoctors(req.params.specialty);
    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error.message);
    res.status(500).json({ error: "Failed to fetch doctors" });
  }
});

// ✅ Book appointment (NO middleware now)
router.post("/", validateAppointment, bookAppointment);

// ✅ Get appointments
router.get("/:patientId", getAppointments);

// ✅ Update appointment
router.put("/:id", validateUpdateAppointment, updateAppointment);

// ✅ Cancel appointment
router.delete("/:id", cancelAppointment);

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