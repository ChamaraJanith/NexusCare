import Appointment from "../models/Appointment.js";
import axios from "axios"; // 🔥 IMPORTANT (missing in your code)
import { io } from "../app.js";


// 🔥 STEP 3 → ADD THIS AT TOP (charges function)
const calculateCharges = (type) => {
  const doctorFee = 2000;
  const serviceFee = 500;

  let hospitalFee = 0;

  if (type === "PHYSICAL") {
    hospitalFee = 1000;
  }

  return {
    doctorFee,
    hospitalFee,
    serviceFee,
    total: doctorFee + serviceFee + hospitalFee
  };
};


// 🔥 Generate Appointment ID
const generateAppointmentId = async () => {
  const count = await Appointment.countDocuments();
  const number = count + 1;
  return `APP-${number.toString().padStart(4, "0")}`;
};

// 🔥 NEW → Get next queue number (same doctor + same date)
export const getNextQueueNumber = async (doctorId, date) => {
  const count = await Appointment.countDocuments({
    doctorId,
    date,
    status: { $ne: "CANCELLED" }
  });

  return count + 1;
};


// ✅ CREATE APPOINTMENT (FINAL 🔥)
export const createAppointment = async (data) => {
  const { doctorId, date, time, appointmentType } = data;

  // ❌ check duplicate slot
  const existing = await Appointment.findOne({
    doctorId,
    date,
    time,
    status: { $ne: "CANCELLED" }
  });

  if (existing) {
    throw new Error("Slot already booked");
  }

  // 🔥 LOCK SLOT (Doctor Service)
  await axios.put(
    "http://localhost:5002/api/availability/book",
    { doctorId, date, time }
  );

  // 🔢 QUEUE NUMBER (same doctor + same date)
  const count = await Appointment.countDocuments({
    doctorId,
    date,
    status: { $ne: "CANCELLED" }
  });

  const queueNumber = count + 1;

  // 💰 CALCULATE CHARGES
  const charges = calculateCharges(appointmentType);

  const appointmentId = await generateAppointmentId();

  const appointment = new Appointment({
    ...data,
    appointmentId,
    queueNumber,              // 🔥 NEW (STEP 6)
    charges,                  // 🔥 STEP 7 ready
    paymentStatus: "PENDING", // 🔥 STEP 7 ready
    status: "PENDING"
  });

  const saved = await appointment.save();

  // ⚡ REAL-TIME EMIT
  io.emit("appointmentBooked", saved);

  return saved;
};

// ✅ Get appointments
export const getAppointmentsByPatient = async (patientId) => {
  return await Appointment.find({ patientId });
};


// ✅ Update appointment (FINAL 🔥)
export const updateAppointment = async (id, patientId, data) => {
  const appointment = await Appointment.findById(id);

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  // 🔐 ownership check
  if (appointment.patientId !== patientId) {
    throw new Error("Unauthorized: Not your appointment");
  }

  // ❌ cannot update cancelled or completed
  if (["CANCELLED", "COMPLETED"].includes(appointment.status)) {
    throw new Error("Cannot update this appointment");
  }

  // 🧠 24 hour validation
  const appointmentDateTime = new Date(
    `${appointment.date} ${appointment.time}`
  );

  const now = new Date();
  const diffHours = (appointmentDateTime - now) / (1000 * 60 * 60);

  if (diffHours < 24) {
    throw new Error(
      "Cannot modify appointment within 24 hours of scheduled time"
    );
  }

  // 🔄 OPTIONAL: if doctor/date changed → recalc queue
  if (data.doctorId || data.date) {
    const newDoctorId = data.doctorId || appointment.doctorId;
    const newDate = data.date || appointment.date;

    const count = await Appointment.countDocuments({
      doctorId: newDoctorId,
      date: newDate,
      status: { $ne: "CANCELLED" }
    });

    appointment.queueNumber = count + 1;
  }

  // ✅ update fields
  Object.assign(appointment, data);

  const updated = await appointment.save();

  // ⚡ REAL-TIME EMIT
  io.emit("appointmentUpdated", updated);

  return updated;
};



// ✅ Cancel appointment (FINAL 🔥)
export const cancelAppointment = async (id, patientId) => {
  const appointment = await Appointment.findById(id);

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  // 🔐 ownership check
  if (appointment.patientId !== patientId) {
    throw new Error("Unauthorized: Not your appointment");
  }

  // ❌ cannot cancel completed
  if (appointment.status === "COMPLETED") {
    throw new Error("Cannot cancel a completed appointment");
  }

  // ❌ already cancelled
  if (appointment.status === "CANCELLED") {
    throw new Error("Appointment already cancelled");
  }

  // 🔄 update status
  appointment.status = "CANCELLED";

  const cancelled = await appointment.save();

  // ⚡ REAL-TIME EMIT
  io.emit("appointmentCancelled", cancelled);

  return cancelled;
};



// 🔥 GET DOCTOR SLOTS (clean version)
export const getDoctorSlots = async (doctorId, date) => {
  try {
    const res = await axios.get(
      `http://localhost:5002/api/availability/${doctorId}/by-date`,
      {
        params: { date }
      }
    );

    return res.data;

  } catch (error) {
    console.error("Error fetching slots:", error.message);
    throw new Error("Failed to fetch doctor slots");
  }
};