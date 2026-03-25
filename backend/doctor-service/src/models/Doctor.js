import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },

    doctorId: {
      type: String, // 🔥 from auth service (DOC-0001)
      required: true,
      unique: true,
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
      trim: true,
      index: true
    },

    qualifications: {
      type: String,
      required: true,
      trim: true
    },

    experience: {
      type: Number,
      required: true,
      min: 0,
      index: true
    },

    hospital: {
      type: String,
      required: true,
      trim: true
    },

    location: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    bio: {
      type: String,
      default: ""
    },

    profileImage: {
      type: String,
      default: ""
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

// 🔍 Full-text search
doctorSchema.index({
  fullName: "text",
  specialization: "text",
  hospital: "text",
  location: "text"
});

export default mongoose.model("Doctor", doctorSchema);