import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
  {
    doctorId: {
      type: String,
      required: true,
      index: true
    },

    // ONE-TIME slot: a specific calendar date
    date: {
      type: Date,
      default: null
    },

    // RECURRING slot: which day of the week (e.g. "Monday", "Tuesday")
    dayOfWeek: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      default: null
    },

    isRecurring: {
      type: Boolean,
      default: false,
      index: true
    },

    startTime: {
      type: String,
      required: true
      // Format: "HH:MM" (24-hour), e.g. "09:00"
    },

    endTime: {
      type: String,
      required: true
    },

      // 🔥 NEW
    slotType: {
    type: String,
    enum: ["ONLINE", "PHYSICAL"],
    required: true
    },
    
    hospital: {
      type: String,
      trim: true,
      default: ""
    },

    location: {
      type: String,
      trim: true,
      default: ""
    },

    platform: {
      type: String,
      trim: true,
      default: ""
    },

    isBooked: {
      type: Boolean,
      default: false
    },

    // Maximum patients allowed per slot (PHYSICAL = configurable, ONLINE = always 1)
    slotCount: {
      type: Number,
      default: 1
    },

    // Tracks how many patients have booked this slot (enables queue numbering)
    bookedCount: {
      type: Number,
      default: 0
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