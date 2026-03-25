import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    doctorId: {
      type: String,
      required: true
    },

    patientId: {
      type: String,
      required: true
    },

    medicines: {
      type: [String],
      required: true
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