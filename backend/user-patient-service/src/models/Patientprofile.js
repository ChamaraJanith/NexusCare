// PatientProfile model - stores patient-specific data
// Linked to User model via userId (e.g., PAT-0001)
const mongoose = require("mongoose");

const patientProfileSchema = new mongoose.Schema(
  {
    // Reference to the user's userId field (not MongoDB _id)
    userId: {
      type: String,
      required: true,
      unique: true,
      ref: "User",
    },

    // Patient's role-specific ID (PAT-0001)
    patientId: {
      type: String,
      required: true,
      unique: true,
    },

    // Personal details
    dateOfBirth: {
      type: Date,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },

    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"],
      default: "Unknown",
    },

    address: {
      street: String,
      city: String,
      district: String,
      postalCode: String,
    },

    // Emergency contact info
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },

    // Known allergies list
    allergies: [
      {
        type: String,
        trim: true,
      },
    ],

    // Chronic/existing conditions
    chronicConditions: [
      {
        type: String,
        trim: true,
      },
    ],

    // Medical reports uploaded by patient (stored in Cloudinary)
    medicalReports: [
      {
        reportId: {
          type: String,
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        description: String,
        fileUrl: {
          type: String,
          required: true,
        },
        publicId: String, // Cloudinary public ID for deletion
        fileType: {
          type: String,
          enum: ["pdf", "image", "other"],
          default: "other",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Prescriptions received from doctors (written by Doctor Service)
    prescriptions: [
      {
        prescriptionId: String,
        doctorId: String,
        doctorName: String,
        appointmentId: String,
        medications: [
          {
            name: String,
            dosage: String,
            frequency: String,
            duration: String,
            notes: String,
          },
        ],
        diagnosis: String,
        notes: String,
        issuedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PatientProfile", patientProfileSchema);