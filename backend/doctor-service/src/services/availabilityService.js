import AvailabilitySlot from "../models/AvailabilitySlot.js";
import Doctor from "../models/Doctor.js";

// CREATE SLOT
export const addSlot = async (data, userId) => {
  const doctor = await Doctor.findOne({ doctorId: data.doctorId });

  if (!doctor || doctor.userId !== userId) {
    throw new Error("Unauthorized");
  }

  // 🚫 prevent duplicate slot
  const exists = await AvailabilitySlot.findOne({
    doctorId: data.doctorId,
    date: data.date,
    startTime: data.startTime,
    isDeleted: false
  });

  if (exists) throw new Error("Slot already exists");

  return await AvailabilitySlot.create(data);
};

// GET SLOTS BY DOCTOR
export const getSlotsByDoctor = async (doctorId) => {
  return await AvailabilitySlot.find({
    doctorId,
    isDeleted: false
  }).sort({ date: 1, startTime: 1 });
};

// ✅ UPDATE SLOT (BY doctorId + date + startTime)
export const updateSlot = async (data, userId) => {
  const { doctorId, date, startTime, ...updateData } = data;

  // check doctor ownership
  const doctor = await Doctor.findOne({ doctorId });

  if (!doctor || doctor.userId !== userId) {
    throw new Error("Unauthorized");
  }

  // find slot
  const slot = await AvailabilitySlot.findOne({
    doctorId,
    date,
    startTime,
    isDeleted: false
  });

  if (!slot) throw new Error("Slot not found");

  // update
  return await AvailabilitySlot.findOneAndUpdate(
    { doctorId, date, startTime },
    updateData,
    {
      returnDocument: "after",
      runValidators: true
    }
  );
};

// ✅ SOFT DELETE SLOT (BY doctorId + date + startTime)
export const deleteSlot = async (data, userId) => {
  const { doctorId, date, startTime } = data;

  // check doctor ownership
  const doctor = await Doctor.findOne({ doctorId });

  if (!doctor || doctor.userId !== userId) {
    throw new Error("Unauthorized");
  }

  // find slot
  const slot = await AvailabilitySlot.findOne({
    doctorId,
    date,
    startTime,
    isDeleted: false
  });

  if (!slot) throw new Error("Slot not found");

  // soft delete
  return await AvailabilitySlot.findOneAndUpdate(
    { doctorId, date, startTime },
    { isDeleted: true },
    {
      returnDocument: "after"
    }
  );
};