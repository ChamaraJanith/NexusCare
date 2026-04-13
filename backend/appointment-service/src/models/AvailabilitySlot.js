import mongoose from "mongoose";

const availabilitySlotSchema = new mongoose.Schema(
  {
    doctorId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    startTime: {
      type: String, // HH:MM
      required: true,
    },
    slotCount: {
      type: Number,
      required: true,
      default: 20,
    },
    bookedCount: {
      type: Number,
      default: 0,
    },
    hospital: {
      type: String,
      required: true,
    },
    hospitalId: {
      type: String,
      default: null,
    },
    appointmentType: {
      type: String,
      enum: ["PHYSICAL", "ONLINE"],
      required: true,
    },
    platform: {
      type: String, // "Zoom", etc.
      default: null,
    },
    serviceFee: {
      type: Number,
      default: 0,
    },
    // Sync metadata
    syncedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "availabilityslots",
  },
);

// Composite index for efficient queries
availabilitySlotSchema.index({ doctorId: 1, date: 1, startTime: 1 });
availabilitySlotSchema.index({ doctorId: 1, date: 1 });

export default mongoose.model("AvailabilitySlot", availabilitySlotSchema);
