const Appointment = require("../models/Appointment");

exports.createAppointment = async (data) => {
  return await Appointment.create(data);
};

exports.getAppointmentsByPatient = async (patientId) => {
  return await Appointment.find({ patientId });
};

exports.updateAppointment = async (id, data) => {
  return await Appointment.findByIdAndUpdate(id, data, { new: true });
};

exports.cancelAppointment = async (id) => {
  return await Appointment.findByIdAndUpdate(
    id,
    { status: "CANCELLED" },
    { new: true }
  );
};