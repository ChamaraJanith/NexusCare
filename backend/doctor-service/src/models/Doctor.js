import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  userId: {
    type: String, // from auth service
    required: true
  },
  fullName: String,
  specialization: String,
  qualifications: String,
  experience: Number,
  hospital: String,
  bio: String
}, { timestamps: true });

export default mongoose.model("Doctor", doctorSchema);