const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // Unique order ID sent to PayHere
    orderId: {
      type: String,
      required: true,
      unique: true,
    },

    // Who paid
    patientId: {
      type: String,
      required: true,
    },

    patientName: {
      type: String,
      required: true,
    },

    patientEmail: {
      type: String,
      required: true,
    },

    // What they paid for
    appointmentId: {
      type: String,
    },

    doctorId: {
      type: String,
      required: true,
    },

    doctorName: {
      type: String,
    },

    // Payment details
    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "LKR",
    },

    // PayHere status codes:
    // 2 = Success, 0 = Pending, -1 = Cancelled, -2 = Failed, -3 = Chargedback
    status: {
      type: String,
      enum: ["pending", "success", "failed", "cancelled", "chargedback"],
      default: "pending",
    },

    // PayHere payment ID (returned in webhook)
    payherePaymentId: {
      type: String,
    },

    // Full webhook payload for records
    webhookData: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);