import mongoose from "mongoose";

/**
 * Local snapshot of doctor profile data, kept in sync via RabbitMQ doctor.updated events.
 * Used as a fallback when doctor-service is unreachable.
 */
const doctorSnapshotSchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "" },
    email: { type: String, default: null },
    specialization: { type: String, default: "" },
    hospital: { type: String, default: "" },
    location: { type: String, default: "" },
    profileImage: { type: String, default: null },
    consultationFee: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    syncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "doctorsnapshots" }
);

export default mongoose.model("DoctorSnapshot", doctorSnapshotSchema);
