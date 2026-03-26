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

// ✅ Search doctors FIRST (important order)
router.get("/search/:specialty", async (req, res) => {
  try {
    const doctors = await doctorService.searchDoctors(req.params.specialty);
    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error.message);
    res.status(500).json({ error: "Failed to fetch doctors" });
  }
});

// ✅ Book appointment
router.post("/", validateAppointment, bookAppointment);

// ✅ Get appointments
router.get("/:patientId", getAppointments);

// ✅ Update appointment
router.put("/:id", validateUpdateAppointment, updateAppointment);

// ✅ Cancel appointment
router.delete("/:id", cancelAppointment);

export default router;