const mongoose = require("mongoose");

const serviceFeeSchema = new mongoose.Schema(
  {
    key: { type: String, default: "global", unique: true },
    amount: { type: Number, required: true, min: 0, default: 500 },
    description: { type: String, default: "Platform service fee" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceFee", serviceFeeSchema);