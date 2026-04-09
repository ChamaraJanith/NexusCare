import mongoose from "mongoose";

/**
 * Doctor professional profile (MS2 — doctor-service)
 *
 * Stores doctor-editable professional details.
 * All fields except doctorId are OPTIONAL to allow upsert on first save.
 */
const doctorSchema = new mongoose.Schema(
  {
    // Business ID from JWT (e.g. DOC-0001) — the only required field.
    doctorId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      trim: true,
      default: null,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },

    userId: {
      type: String,
      trim: true,
      default: null,
    },

    registrationNumber: {
      type: String,
      trim: true,
      default: null,
    },

    specialty: {
      type: String,
      trim: true,
      default: null,
    },

    subSpecialty: {
      type: String,
      trim: true,
      default: null,
    },

    consultationFee: {
      type: Number,
      min: 0,
      default: null,
    },

    qualifications: [
      {
        type: String,
        trim: true,
      },
    ],

    verificationDocuments: [
      {
        title: String,
        fileUrl: String,
        publicId: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    // Profile image — stores a URL path string (e.g. "/uploads/1234.jpg")
    // Also supports legacy Cloudinary object format { url, publicId }
    profileImage: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Years of clinical experience
    experience: {
      type: Number,
      min: 0,
      default: null,
    },

    // Primary hospital / clinic name
    hospital: {
      type: String,
      trim: true,
      default: null,
    },

    // City / location shown to patients
    location: {
      type: String,
      trim: true,
      default: null,
    },

    // Short professional bio for patients
    bio: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "doctorprofiles",
  }
);

// Text search on specialty, hospital & location
doctorSchema.index({ specialty: "text", hospital: "text", location: "text" });

export default mongoose.model("Doctor", doctorSchema, "doctorprofiles");