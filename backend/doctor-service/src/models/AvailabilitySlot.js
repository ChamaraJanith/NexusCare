import mongoose from "mongoose";

const slotSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor"
  },
  date: String,
  startTime: String,
  endTime: String,
  isBooked: {
    type: Boolean,
    default: false
  }
});

export default mongoose.model("AvailabilitySlot", slotSchema);