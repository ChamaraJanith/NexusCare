const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['payment', 'appointment', 'registration', 'system', 'other'],
    default: 'other',
  },
  event: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'failed', 'pending', 'confirmed', 'rejected', 'cancelled'],
    default: 'success',
  },
  appointmentId: String,
  paymentId: String,
  doctorId: String,
  patientId: String,
  email: String,
  phoneNumber: String,
  message: String,
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notification', notificationSchema);
