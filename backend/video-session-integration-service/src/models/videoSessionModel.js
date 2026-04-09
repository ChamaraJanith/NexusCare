const mongoose = require('mongoose');

const videoSessionSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    roomUrl: {
      type: String,
      required: true,
    },
    patientId: {
      type: String,
      required: true,
    },
    doctorId: {
      type: String,
      required: true,
    },
    appointmentId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    patientEmail: {
      type: String,
      trim: true,
      default: '',
    },
    doctorEmail: {
      type: String,
      trim: true,
      default: '',
    },
    patientPhone: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'CANCELLED', 'FAILED'],
      default: 'ACTIVE',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('VideoSession', videoSessionSchema);
