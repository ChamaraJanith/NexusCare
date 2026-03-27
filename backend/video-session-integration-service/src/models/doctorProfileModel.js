const mongoose = require('mongoose');

// Mirror doctor-service Doctor document shape for read-only queries.
const doctorProfileSchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true, index: true },
    specialization: { type: String, default: null },
    hospital: { type: String, default: null },
    location: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    collection: 'doctorprofiles'
  }
);

module.exports = mongoose.models.VideoDoctorProfile || mongoose.model('VideoDoctorProfile', doctorProfileSchema);
