import Appointment from "../models/Appointment.js";
import axios from "axios"; // 🔥 IMPORTANT (missing in your code)


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


// ✅ Create Appointment (🔥 UPDATED)
export const createAppointment = async (data) => {
  const { doctorId, date, time, appointmentType } = data;

  // ❌ check duplicate
  const existing = await Appointment.findOne({
    doctorId,
    date,
    time,
    status: { $ne: "CANCELLED" }
  });

  if (existing) {
    throw new Error("Slot already booked");
  }

  // 🔥 LOCK SLOT (doctor-service)
  await axios.put(
    "http://localhost:5002/api/availability/book",
    { doctorId, date, time }
  );

  // 🔥 CALCULATE CHARGES
  const charges = calculateCharges(appointmentType);

  const appointmentId = await generateAppointmentId();

  const appointment = new Appointment({
    ...data,
    appointmentId,
    charges,                 // 🔥 NEW
    paymentStatus: "PENDING",// 🔥 NEW
    status: "PENDING"
  });

  return await appointment.save();
};


// ✅ Get appointments
export const getAppointmentsByPatient = async (patientId) => {
  return await Appointment.find({ patientId });
};


// ✅ Update appointment
export const updateAppointment = async (id, patientId, data) => {
  const appointment = await Appointment.findById(id);

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  if (appointment.patientId !== patientId) {
    throw new Error("Unauthorized: Not your appointment");
  }

  return await Appointment.findByIdAndUpdate(id, data, { new: true });
};


// ✅ Cancel appointment
export const cancelAppointment = async (id, patientId) => {
  const appointment = await Appointment.findById(id);

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  if (appointment.patientId !== patientId) {
    throw new Error("Unauthorized: Not your appointment");
  }

  return await Appointment.findByIdAndUpdate(
    id,
    { status: "CANCELLED" },
    { new: true }
  );
};


// 🔥 GET SLOTS (FIXED - NO TOKEN)
export const getDoctorSlots = async (doctorId, date) => {
  const res = await axios.get(
    `http://localhost:5002/api/availability/${doctorId}/by-date?date=${date}`
  );

  return res.data;
};