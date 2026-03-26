import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    unique: true
  },

  patientId: {
    type: String,
    required: true
  },

  doctorId: {
    type: String,
    required: true
  },

  specialty: String,

  date: {
    type: String,
    required: true
  },

  time: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ["PENDING", "VERIFIED", "CONFIRMED", "COMPLETED", "CANCELLED"],
    default: "PENDING"
  }

}, { timestamps: true });

export default mongoose.model("Appointment", appointmentSchema);