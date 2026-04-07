import Appointment from "../models/Appointment.js";
import axios from "axios"; // 🔥 IMPORTANT (missing in your code)
import { io } from "../app.js";

const FEE_SERVICE_URL = process.env.FEE_SERVICE_URL || "http://localhost:5007";
const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY;



// 🔥 STEP 3 → ADD THIS AT TOP (charges function)
const fetchCharges = async (doctorId, hospitalId, appointmentType) => {
  const internalKeys = [INTERNAL_SERVICE_KEY, process.env.INTERNAL_SERVICE_KEY_FALLBACK].filter(Boolean);

  for (const key of internalKeys) {
    try {
      const { data } = await axios.post(
        `${FEE_SERVICE_URL}/api/service-fee/calculate`,
        { doctorId, hospitalId, appointmentType },
        {
          headers: { "x-internal-service-key": key },
          timeout: 5000,
        }
      );
      if (data.success) return data.data;
      console.warn(`⚠️ MS6 returned failure with key ${key}:`, data);
    } catch (err) {
      console.warn(`⚠️ MS6 unreachable with key ${key}:`, err.response?.status || err.message);
    }
  }

  console.warn("⚠️ MS6 unreachable with all internal keys, using fallback fees.");
  const serviceFee = 500;
  const doctorFee = 2000;
  const hospitalFee = appointmentType === "PHYSICAL" ? 1000 : 0;
  return { doctorFee, hospitalFee, serviceFee, total: doctorFee + hospitalFee + serviceFee };
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
  const { doctorId, date, time } = data;
  const appointmentType = (data.appointmentType || data.type || "").toString().trim().toUpperCase();

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

  // 🔥 LOCK SLOT — try/catch so booking doesn't fail if slot lock fails
  try {
    await axios.put(
      "http://localhost:5002/api/availability/book",
      { doctorId, date, time }
    );
  } catch (slotErr) {
    console.warn("⚠️ Slot lock failed (non-critical):", slotErr.response?.data || slotErr.message);
    // Continue — don't throw, appointment can still be saved
  }

  // 🔢 QUEUE NUMBER
  const count = await Appointment.countDocuments({
    doctorId,
    date,
    status: { $ne: "CANCELLED" }
  });

  const queueNumber = count + 1;

  // 💰 CALCULATE CHARGES
  const charges = await fetchCharges(doctorId, data.hospitalId || null, appointmentType);

  const appointmentId = await generateAppointmentId();

  const appointment = new Appointment({
    ...data,
    appointmentType,
    appointmentId,
    queueNumber,
    charges,
    paymentStatus: "PENDING",
    status: "PENDING"
  });

  const saved = await appointment.save();

  io.emit("appointmentBooked", saved);

  return saved;
};
// ✅ Get appointments
export const getAppointmentsByPatient = async (patientId) => {
  return await Appointment.find({ patientId });
};

// 👨‍⚕️ Get appointments for a doctor
export const getAppointmentsByDoctor = async (doctorId) => {
  return await Appointment.find({ doctorId });
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