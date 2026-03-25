const Appointment = require("../models/Appointment");

// Create Appointment
exports.createAppointment = async (data) => {
  const appointment = new Appointment(data);
  return await appointment.save();
};

// Get appointments by patient
exports.getAppointmentsByPatient = async (patientId) => {
  return await Appointment.find({ patientId });
};

// Update appointment
exports.updateAppointment = async (id, data) => {
  return await Appointment.findByIdAndUpdate(id, data, { new: true });
};

// Cancel appointment
exports.cancelAppointment = async (id) => {
  return await Appointment.findByIdAndUpdate(
    id,
    { status: "CANCELLED" },
    { new: true }
  );
};