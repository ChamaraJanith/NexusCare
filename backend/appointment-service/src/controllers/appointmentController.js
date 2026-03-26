import {
  createAppointment,
  getAppointmentsByPatient,
  updateAppointment as updateAppointmentService,
  cancelAppointment as cancelAppointmentService
} from "../services/appointmentService.js";

import { verifyUser } from "../services/authService.js";

// ✅ Book Appointment (UPDATED 🔥)
export const bookAppointment = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    // ❌ No token
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // 🔥 Call MS1 (User Service)
    const userData = await verifyUser(token);

    // ❌ Only patients allowed
    if (userData.role !== "patient") {
      return res.status(403).json({ error: "Only patients can book appointments" });
    }

    // ✅ Use patientId from MS1
    const data = {
      ...req.body,
      patientId: userData.roleId   // PAT-0001
    };

    const appointment = await createAppointment(data);

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment
    });

  } catch (error) {
    console.error("Error booking appointment:", error.message);
    res.status(401).json({ error: "Unauthorized" });
  }
};

// ✅ Get Appointments
export const getAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;

    const appointments = await getAppointmentsByPatient(patientId);

    res.status(200).json(appointments);

  } catch (error) {
    console.error("Error fetching appointments:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Update Appointment
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await updateAppointmentService(id, req.body);

    res.status(200).json(updated);

  } catch (error) {
    console.error("Error updating appointment:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Cancel Appointment
export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const cancelled = await cancelAppointmentService(id);

    res.status(200).json(cancelled);

  } catch (error) {
    console.error("Error cancelling appointment:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};