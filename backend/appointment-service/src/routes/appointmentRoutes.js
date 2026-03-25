import express from "express";
import {
  bookAppointment,
  getAppointments,
  updateAppointment,
  cancelAppointment
} from "../controllers/appointmentController.js";

const router = express.Router();

router.post("/", bookAppointment);
router.get("/:patientId", getAppointments);
router.put("/:id", updateAppointment);
router.delete("/:id", cancelAppointment);

export default router;