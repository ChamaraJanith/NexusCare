import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // from auth service
      required: true,
      index: true
    },

    fullName: {
      type: String,
      required: true,
      trim: true
    },

    specialization: {
      type: String,
      required: true,
      trim: true
    },

    qualifications: {
      type: String,
      required: true,
      trim: true
    },

    experience: {
      type: Number,
      required: true,
      min: 0
    },

    hospital: {
      type: String,
      required: true,
      trim: true
    },

    bio: {
      type: String,
      default: ""
    },

    profileImage: {
      type: String, // URL (Cloudinary etc.)
      default: ""
    },

    isVerified: {
      type: Boolean,
      default: false // admin verify doctor
    },

    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("Doctor", doctorSchema);