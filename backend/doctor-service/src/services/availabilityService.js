import AvailabilitySlot from "../models/AvailabilitySlot.js";

// ─── CREATE SLOT ────────────────────────────────────────────────
export const addSlot = async (body, doctorId) => {
  const { type, date, dayOfWeek, startTime, endTime, hospital, location, platform, slotType, slotCount } = body;

  if (!startTime || !endTime) throw new Error("startTime and endTime are required");
  if (startTime >= endTime) throw new Error("startTime must be before endTime");
  if (!slotType) throw new Error("slotType required (ONLINE / PHYSICAL)");

  let slotData = { 
    doctorId, 
    startTime, 
    endTime, 
    hospital: hospital || location || "", // preserve backwards compatibility if hospital is explicitly passed
    location: location || hospital || "",
    platform: platform || "",
    slotType,
    bookedCount: 0
  };

  // Enforce capacity rules per slot type
  if (slotType === "ONLINE") {
    slotData.slotCount = 1; // ONLINE always single-booking
  } else if (slotType === "PHYSICAL") {
    slotData.slotCount = slotCount ? Number(slotCount) : 1; // PHYSICAL can have custom queue size
  }

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

// ─── GET SLOTS BY DOCTOR (templates only — not instances) ────────
export const getSlotsByDoctor = async (doctorId) => {
  return await AvailabilitySlot.find({
    doctorId,
    isDeleted: false,
    parentSlotId: null  // exclude auto-generated instances
  }).sort({ isRecurring: 1, dayOfWeek: 1, date: 1, startTime: 1 });
};

// ─── LAZY INSTANCE GENERATOR ──────────────────────────────────────
/**
 * For a given recurring template + specific calendar date,
 * find OR create an independent instance slot.
 * Each instance has its own slotCount, bookedCount, and queue.
 */
export const getOrCreateSlotInstance = async (doctorId, date, parentSlot) => {
  // Normalize to start-of-day for consistent matching
  const instanceDate = new Date(date);
  instanceDate.setHours(0, 0, 0, 0);

  // 1. Check if an instance already exists for this parent + date
  const existing = await AvailabilitySlot.findOne({
    parentSlotId: parentSlot._id,
    date: instanceDate,
    isDeleted: false
  });

  if (existing) return existing;

  // 2. Not found → create a fresh instance inheriting the template's config
  const instance = await AvailabilitySlot.create({
    doctorId,
    date: instanceDate,
    startTime:    parentSlot.startTime,
    endTime:      parentSlot.endTime,
    slotType:     parentSlot.slotType,
    hospital:     parentSlot.hospital  || "",
    location:     parentSlot.location  || "",
    platform:     parentSlot.platform  || "",
    slotCount:    parentSlot.slotCount,
    bookedCount:  0,
    isBooked:     false,
    isRecurring:  false,       // instances are date-based, not recurring
    dayOfWeek:    null,
    parentSlotId: parentSlot._id,
    isDeleted:    false
  });

  return instance;
};

// ─── UPDATE SLOT BY _id ──────────────────────────────────────────
export const updateSlot = async (slotId, body, doctorId) => {
  const slot = await AvailabilitySlot.findOne({ _id: slotId, isDeleted: false });
  if (!slot) throw new Error("Slot not found");
  if (slot.doctorId !== doctorId) throw new Error("Forbidden: You can only update your own slots");

  const { type, date, dayOfWeek, startTime, endTime, hospital, location, platform, slotType } = body;

  const updates = {};
  if (startTime) updates.startTime = startTime;
  if (endTime) updates.endTime = endTime;
  if (hospital !== undefined) updates.hospital = hospital;
  if (location !== undefined) updates.location = location;
  if (platform !== undefined) updates.platform = platform;
  if (slotType !== undefined) updates.slotType = slotType;

  // slotCount can only be updated on PHYSICAL slots
  const effectiveSlotType = slotType || slot.slotType;
  if (effectiveSlotType === "PHYSICAL" && body.slotCount !== undefined) {
    const newSlotCount = Number(body.slotCount);
    if (newSlotCount < slot.bookedCount) {
      throw new Error("slotCount cannot be less than bookedCount");
    }
    updates.slotCount = newSlotCount;
  }

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