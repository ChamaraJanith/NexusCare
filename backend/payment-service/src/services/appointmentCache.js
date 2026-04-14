/**
 * AppointmentSnapshot — local read-replica in the payment service DB.
 * Kept in sync via RabbitMQ appointment.# events.
 * Used as fallback when appointment-service is unreachable.
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    appointmentId: { type: String, required: true, unique: true, index: true },
    mongoId: { type: String, index: true },
    patientId: { type: String, required: true, index: true },
    doctorId: { type: String, default: "" },
    doctorName: { type: String, default: "" },
    patientName: { type: String, default: "" },
    patientEmail: { type: String, default: "" },
    patientPhone: { type: String, default: "" },
    date: { type: String, default: "" },
    time: { type: String, default: "" },
    appointmentType: { type: String, default: "PHYSICAL" },
    status: { type: String, default: "PENDING" },
    paymentStatus: { type: String, default: "PENDING" },
    charges: {
      doctorFee: { type: Number, default: 0 },
      hospitalFee: { type: Number, default: 0 },
      serviceFee: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    syncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "appointmentsnapshots" }
);

const AppointmentSnapshot = mongoose.model("AppointmentSnapshot", schema);

/**
 * Update paymentStatus by any known ID (APP-XXXX, MongoDB _id, or mongoId).
 * This is the critical path called after a successful payment.
 */
const updateSnapshotPaymentStatus = async (appointmentId, paymentStatus) => {
  const result = await AppointmentSnapshot.findOneAndUpdate(
    {
      $or: [
        { appointmentId },
        { mongoId: appointmentId },
      ],
    },
    { $set: { paymentStatus, syncedAt: new Date() } },
    { new: true }
  );
  return result;
};

const upsertSnapshot = async (payload) => {
  const id = payload.appointmentId || payload.id;
  if (!id) return;

  // Fields that are always updated
  const $set = {
    appointmentId: payload.appointmentId || id,
    mongoId: payload.id || null,
    patientId: payload.patientId,
    doctorId: payload.doctorId || "",
    doctorName: payload.doctorName || "",
    patientName: payload.patientName || "",
    patientEmail: payload.patientEmail || "",
    patientPhone: payload.patientPhone || "",
    date: payload.date || "",
    time: payload.time || "",
    appointmentType: payload.appointmentType || "PHYSICAL",
    status: payload.status || "PENDING",
    paymentStatus: payload.paymentStatus || "PENDING",
    syncedAt: new Date(),
  };

  // Only update charges if the event actually carries them (non-empty)
  // This prevents a status-only event (no charges field) from wiping stored charges.
  if (payload.charges && typeof payload.charges === "object") {
    const { doctorFee, hospitalFee, serviceFee, total } = payload.charges;
    const hasRealFees =
      Number(doctorFee) > 0 ||
      Number(hospitalFee) > 0 ||
      Number(serviceFee) > 0 ||
      Number(total) > 0;
    if (hasRealFees) {
      $set.charges = payload.charges;
    }
  }

  await AppointmentSnapshot.findOneAndUpdate(
    { $or: [{ appointmentId: id }, { mongoId: payload.id }] },
    { $set },
    { upsert: true, new: true }
  );
};

const getPatientSnapshots = async (patientId) => {
  return AppointmentSnapshot.find({ patientId }).sort({ createdAt: -1 }).lean();
};

module.exports = { AppointmentSnapshot, upsertSnapshot, getPatientSnapshots, updateSnapshotPaymentStatus };
