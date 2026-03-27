import AvailabilitySlot from "../models/AvailabilitySlot.js";

// ─── CREATE SLOT ────────────────────────────────────────────────
export const addSlot = async (body, doctorId) => {
  const { type, date, dayOfWeek, startTime, endTime, hospital } = body;

  if (!startTime || !endTime) throw new Error("startTime and endTime are required");
  if (startTime >= endTime) throw new Error("startTime must be before endTime");

  let slotData = { doctorId, startTime, endTime, hospital: hospital || "" };

  if (type === "recurring") {
    if (!dayOfWeek) throw new Error("dayOfWeek is required for recurring slots");
    slotData.isRecurring = true;
    slotData.dayOfWeek = dayOfWeek;
    slotData.date = null;

    // Prevent duplicate recurring slot
    const exists = await AvailabilitySlot.findOne({ doctorId, dayOfWeek, startTime, isRecurring: true, isDeleted: false });
    if (exists) throw new Error(`A recurring slot already exists every ${dayOfWeek} at ${startTime}`);

  } else {
    if (!date) throw new Error("date is required for one-time slots");
    slotData.isRecurring = false;
    slotData.date = new Date(date);
    slotData.dayOfWeek = null;

    // Prevent duplicate one-time slot
    const exists = await AvailabilitySlot.findOne({ doctorId, date: new Date(date), startTime, isRecurring: false, isDeleted: false });
    if (exists) throw new Error("A slot already exists at this date and time");
  }

  return await AvailabilitySlot.create(slotData);
};

// ─── GET SLOTS BY DOCTOR ─────────────────────────────────────────
export const getSlotsByDoctor = async (doctorId) => {
  return await AvailabilitySlot.find({ doctorId, isDeleted: false })
    .sort({ isRecurring: 1, dayOfWeek: 1, date: 1, startTime: 1 });
};

// ─── UPDATE SLOT BY _id ──────────────────────────────────────────
export const updateSlot = async (slotId, body, doctorId) => {
  const slot = await AvailabilitySlot.findOne({ _id: slotId, isDeleted: false });
  if (!slot) throw new Error("Slot not found");
  if (slot.doctorId !== doctorId) throw new Error("Forbidden: You can only update your own slots");

  const { type, date, dayOfWeek, startTime, endTime, hospital } = body;

  const updates = {};
  if (startTime) updates.startTime = startTime;
  if (endTime) updates.endTime = endTime;
  if (hospital !== undefined) updates.hospital = hospital;

  if (type === "recurring") {
    if (!dayOfWeek) throw new Error("dayOfWeek required for recurring slots");
    updates.isRecurring = true;
    updates.dayOfWeek = dayOfWeek;
    updates.date = null;
  } else if (type === "single") {
    if (!date) throw new Error("date required for one-time slots");
    updates.isRecurring = false;
    updates.date = new Date(date);
    updates.dayOfWeek = null;
  }

  if (updates.startTime && updates.endTime && updates.startTime >= updates.endTime) {
    throw new Error("startTime must be before endTime");
  }

  return await AvailabilitySlot.findByIdAndUpdate(slotId, updates, { new: true, runValidators: true });
};

// ─── SOFT DELETE SLOT BY _id ─────────────────────────────────────
export const deleteSlot = async (slotId, doctorId) => {
  const slot = await AvailabilitySlot.findOne({ _id: slotId, isDeleted: false });
  if (!slot) throw new Error("Slot not found");
  if (slot.doctorId !== doctorId) throw new Error("Forbidden: You can only delete your own slots");

  return await AvailabilitySlot.findByIdAndUpdate(slotId, { isDeleted: true }, { new: true });
};