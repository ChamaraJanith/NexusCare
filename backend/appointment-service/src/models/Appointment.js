// 🔥 STEP 3 UPDATE → patient + charges + payment

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

  date: {
    type: String,
    required: true
  },

  time: {
    type: String,
    required: true
  },

  // 🔥 NEW → patient details
  patientName: String,
  email: String,
  phone: String,
  age: Number,
  gender: String,

  // 🔥 NEW → ONLINE / PHYSICAL
  appointmentType: {
    type: String,
    enum: ["ONLINE", "PHYSICAL"],
    required: true
  },

  // 🔥 NEW → charges
  charges: {
    doctorFee: Number,
    hospitalFee: Number,
    serviceFee: Number,
    total: Number
  },

  paymentStatus: {
    type: String,
    enum: ["PENDING", "PAID"],
    default: "PENDING"
  },

  status: {
    type: String,
    enum: ["PENDING", "VERIFIED", "CONFIRMED", "COMPLETED", "CANCELLED"],
    default: "PENDING"
  }

}, { timestamps: true });

export default mongoose.model("Appointment", appointmentSchema);