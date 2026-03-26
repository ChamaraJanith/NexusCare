import Appointment from "../models/Appointment.js";

// 🔥 Generate Appointment ID (APP-0001)
const generateAppointmentId = async () => {
  const count = await Appointment.countDocuments();
  const number = count + 1;
  return `APP-${number.toString().padStart(4, "0")}`;
};

// ✅ Create Appointment
export const createAppointment = async (data) => {
  const appointmentId = await generateAppointmentId();

  const appointment = new Appointment({
    ...data,
    appointmentId
  });

  return await appointment.save();
};

// ✅ Get appointments by patient
export const getAppointmentsByPatient = async (patientId) => {
  return await Appointment.find({ patientId });
};

// ✅ Update appointment
export const updateAppointment = async (id, data) => {
  return await Appointment.findByIdAndUpdate(id, data, { new: true });
};

// ✅ Cancel appointment
export const cancelAppointment = async (id) => {
  return await Appointment.findByIdAndUpdate(
    id,
    { status: "CANCELLED" },
    { new: true }
  );
};