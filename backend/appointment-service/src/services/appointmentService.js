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

// ✅ Update appointment (with ownership check)
export const updateAppointment = async (id, patientId, data) => {
  const appointment = await Appointment.findById(id);

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  // 🔥 Check ownership
  if (appointment.patientId !== patientId) {
    throw new Error("Unauthorized: Not your appointment");
  }

  return await Appointment.findByIdAndUpdate(id, data, { new: true });
};


// ✅ Cancel appointment (with ownership check)
export const cancelAppointment = async (id, patientId) => {
  const appointment = await Appointment.findById(id);

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  // 🔥 Check ownership
  if (appointment.patientId !== patientId) {
    throw new Error("Unauthorized: Not your appointment");
  }

  return await Appointment.findByIdAndUpdate(
    id,
    { status: "CANCELLED" },
    { new: true }
  );
};