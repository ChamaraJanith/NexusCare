import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    doctorId: {
      type: String, // from auth service JWT roleId (e.g., DOC-0001)
      required: true,
      unique: true,
    },

    profileImage: {
      url: String,
      publicId: String,
    },
    
    specialty: {
      type: String,
    },

    specialization: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    qualifications: {
      type: String,
      required: true,
      trim: true,
    },

    experience: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },

    hospital: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

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
    collection: "doctorprofiles", // 🔥🔥🔥 CRITICAL FIX
  }
);

// 🔍 Full-text search (only professional fields)
doctorSchema.index({
  specialization: "text",
  hospital: "text",
  location: "text",
});

export default mongoose.model("Doctor", doctorSchema, "doctorprofiles");