import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema({
  doctorId: String,
  patientId: String,
  medicines: [String],
  notes: String,
  date: { type: Date, default: Date.now }
});

export default mongoose.model("Prescription", prescriptionSchema);