const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema(
  {
    hospitalId: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    location: { type: String, trim: true, default: "" },
    contactNumber: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    hospitalFee: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

hospitalSchema.pre("save", async function () {
  if (this.isNew && !this.hospitalId) {
    const count = await mongoose.model("Hospital").countDocuments();
    this.hospitalId = `HOSP-${String(count + 1).padStart(4, "0")}`;
  }
});

module.exports = mongoose.model("Hospital", hospitalSchema);