import mongoose from "mongoose";

/**
 * Local read-replica of appointment requests for this doctor.
 * Kept in sync via RabbitMQ appointment.# events from appointment-service.
 * Allows doctors to view and act on appointments even when appointment-service is down.
 */
const appointmentRequestSchema = new mongoose.Schema(
  {
    appointmentId: { type: String, required: true, unique: true, index: true },
    mongoId:       { type: String, index: true },
    doctorId:      { type: String, required: true, index: true },
    patientId:     { type: String, default: "" },
    patientName:   { type: String, default: "" },
    patientEmail:  { type: String, default: "" },
    patientPhone:  { type: String, default: "" },
    date:          { type: String, default: "" },
    time:          { type: String, default: "" },
    appointmentType: { type: String, default: "PHYSICAL" },
    status:        { type: String, default: "PENDING" },
    paymentStatus: { type: String, default: "PENDING" },
    queueNumber:   { type: Number, default: null },
    rejectionReason: { type: String, default: null },
    charges: {
      doctorFee:   { type: Number, default: 0 },
      hospitalFee: { type: Number, default: 0 },
      serviceFee:  { type: Number, default: 0 },
      total:       { type: Number, default: 0 },
    },
    syncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "appointmentrequests" }
);

export default mongoose.model("AppointmentRequest", appointmentRequestSchema);
