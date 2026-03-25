// Counter model - used to generate sequential IDs like USER-0001, PAT-0001, DOC-0001
const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  // The name of the counter (e.g., "user", "patient", "doctor")
  name: {
    type: String,
    required: true,
    unique: true,
  },
  // The current sequence value
  seq: {
    type: Number,
    default: 0,
  },
});

// Static method to get next sequence value and increment it atomically
counterSchema.statics.getNextSequence = async function (counterName) {
  const counter = await this.findOneAndUpdate(
    { name: counterName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true } // upsert: create if not exists
  );
  return counter.seq;
};

// Helper to format the number as padded string (e.g., 1 -> "0001")
counterSchema.statics.formatId = function (prefix, seq) {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
};

module.exports = mongoose.model("Counter", counterSchema);