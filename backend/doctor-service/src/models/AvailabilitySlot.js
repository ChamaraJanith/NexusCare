import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
  {
    doctorId: {
      type: String,
      ref: "Doctor",
      required: true,
      index: true
    },

    date: {
      type: Date,
      required: true
    },

    startTime: {
      type: String,
      required: true
    },

    endTime: {
      type: String,
      required: true
    },

    isBooked: {
      type: Boolean,
      default: false
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("AvailabilitySlot", slotSchema);