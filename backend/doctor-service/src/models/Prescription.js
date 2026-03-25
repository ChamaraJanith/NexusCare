import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema({
  doctorId: String,
  patientId: String,
  medicines: [String],
  notes: String,

  status: {
    type: String,
    enum: ["active", "updated", "cancelled"],
    default: "active"
  },

  isDeleted: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

export default mongoose.model("Prescription", prescriptionSchema);