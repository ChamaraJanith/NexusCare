import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    doctorId: {
      type: String,
      required: true
    },

    doctorName: {
      type: String,
    },

    patientId: {
      type: String,
      required: true
    },

    appointmentId: {
      type: String,
    },

    diagnosis: {
      type: String,
      required: true
    },

    symptoms: {
      type: mongoose.Schema.Types.Mixed, // Can be String or [String]
    },

    medicines: {
      type: [mongoose.Schema.Types.Mixed], // Can be String or Object {name, dosage, frequency, duration, instructions}
      required: true
    },

    advice: {
      type: String,
    },

    followUpDate: {
      type: Date,
    },

    notes: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: ["active", "updated", "cancelled"],
      default: "active"
    },

    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("Prescription", prescriptionSchema);