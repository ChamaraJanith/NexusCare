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

  doctorName: {
    type: String,
    default: null
  },

  doctorEmail: {
    type: String,
    default: null
  },

  doctorSpecialization: {
    type: String,
    default: null
  },

  doctorHospital: {
    type: String,
    default: null
  },

  doctorProfileImage: {
    type: String,
    default: null
  },

  doctorConsultationFee: {
    type: Number,
    default: 0
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

  videoRoomId: {
    type: String,
    default: null
  },

  videoRoomUrl: {
    type: String,
    default: null
  },

  status: {
    type: String,
    enum: ["PENDING", "VERIFIED", "CONFIRMED", "COMPLETED", "CANCELLED"],
    default: "PENDING"
  },

  hospitalId: {
    type: String,
    default: null,
  },

  queueNumber: {
    type: Number
  },

  rejectionReason: {
  type: String,
  default: null
}

}, { timestamps: true });

export default mongoose.model("Appointment", appointmentSchema);