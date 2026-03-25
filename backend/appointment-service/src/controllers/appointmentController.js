const service = require("../services/appointmentService");

// Book Appointment
exports.bookAppointment = async (req, res) => {
  try {
    const data = await service.createAppointment(req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Appointments
exports.getAppointments = async (req, res) => {
  try {
    const data = await service.getAppointmentsByPatient(req.params.patientId);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Appointment
exports.updateAppointment = async (req, res) => {
  try {
    const data = await service.updateAppointment(req.params.id, req.body);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel Appointment
exports.cancelAppointment = async (req, res) => {
  try {
    const data = await service.cancelAppointment(req.params.id);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};