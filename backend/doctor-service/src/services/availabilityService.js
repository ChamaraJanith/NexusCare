import AvailabilitySlot from "../models/AvailabilitySlot.js";
import Doctor from "../models/Doctor.js";

// CREATE
export const addSlot = async (data, userId) => {
  // 🔐 ownership (doctor check)
  const doctor = await Doctor.findById(data.doctorId);
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

// READ
export const getSlotsByDoctor = async (doctorId) => {
  return await AvailabilitySlot.find({
    doctorId,
    isDeleted: false
  });
};

// UPDATE
export const updateSlot = async (id, data, userId) => {
  const slot = await AvailabilitySlot.findById(id);
  if (!slot || slot.isDeleted) throw new Error("Slot not found");

  const doctor = await Doctor.findById(slot.doctorId);
  if (doctor.userId !== userId) throw new Error("Unauthorized");

  return await AvailabilitySlot.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  });
};

// SOFT DELETE
export const deleteSlot = async (id, userId) => {
  const slot = await AvailabilitySlot.findById(id);
  if (!slot || slot.isDeleted) throw new Error("Slot not found");

  const doctor = await Doctor.findById(slot.doctorId);
  if (doctor.userId !== userId) throw new Error("Unauthorized");

  return await AvailabilitySlot.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );
};