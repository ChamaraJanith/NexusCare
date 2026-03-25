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
      type: String, // 🔥 NEW (for filtering)
      required: true,
      trim: true,
      index: true
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

// 🔍 FULL-TEXT SEARCH INDEX 🔥
doctorSchema.index({
  fullName: "text",
  specialization: "text",
  hospital: "text",
  location: "text"
});

export default mongoose.model("Doctor", doctorSchema);