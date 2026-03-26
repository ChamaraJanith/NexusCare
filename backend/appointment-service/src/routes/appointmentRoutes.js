import express from "express";
import {
  bookAppointment,
  getAppointments,
  updateAppointment,
  cancelAppointment
} from "../controllers/appointmentController.js";

import { validateAppointment ,validateUpdateAppointment} from "../validators/appointmentValidator.js";
import * as doctorService from "../services/doctorService.js";

const router = express.Router();

// ✅ Book appointment with validation
router.post("/", validateAppointment, bookAppointment);

// ✅ Get appointments
router.get("/:patientId", getAppointments);

// ✅ Update appointment
router.put("/:id", validateUpdateAppointment, updateAppointment);

// ✅ Cancel appointment
router.delete("/:id", cancelAppointment);

// ✅ Search doctors by specialty
router.get("/search/:specialty", async (req, res) => {
  try {
    const doctors = await doctorService.searchDoctors(req.params.specialty);
    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error.message);
    res.status(500).json({ error: "Failed to fetch doctors" });
  }
});

router.put("/status/:id", async (req, res) => {
  const updated = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  res.json(updated);
});

export default router;