const mongoose = require('mongoose');

const doctorCatalogSchema = new mongoose.Schema(
  {
    doctorId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      default: null,
    },
    specialization: {
      type: String,
      default: null,
    },
    hospital: {
      type: String,
      default: null,
    },
    location: {
      type: String,
      default: null,
    },
    profileImage: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'doctorcatalog',
  }
);

module.exports = mongoose.model('DoctorCatalog', doctorCatalogSchema);