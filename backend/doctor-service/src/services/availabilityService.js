import AvailabilitySlot from "../models/AvailabilitySlot.js";

export const addSlot = async (data) => {
  return await AvailabilitySlot.create(data);
};

export const getSlotsByDoctor = async (doctorId) => {
  return await AvailabilitySlot.find({ doctorId });
};

export const updateSlot = async (id, data) => {
  return await AvailabilitySlot.findByIdAndUpdate(id, data, { new: true });
};

export const deleteSlot = async (id) => {
  return await AvailabilitySlot.findByIdAndDelete(id);
};