import * as availabilityService from "../services/availabilityService.js";
import { getOrCreateSlotInstance } from "../services/availabilityService.js";
import AvailabilitySlot from "../models/AvailabilitySlot.js";

// POST /api/availability
export const createSlot = async (req, res) => {
  try {
    const doctorId = req.user.doctorId || req.user.roleId;
    const slot = await availabilityService.addSlot(req.body, doctorId);

    res.status(201).json({
      success: true,
      data: slot,
      message: "Availability slot created successfully"
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const resolveSlotsForDate = async (doctorId, date) => {
  const selectedDate = new Date(date);
  selectedDate.setHours(0, 0, 0, 0);
  const nextDate = new Date(selectedDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayOfWeek = dayNames[selectedDate.getDay()];

  const oneTimeSlots = await AvailabilitySlot.find({
    doctorId,
    date: { $gte: selectedDate, $lt: nextDate },
    isDeleted: false,
    parentSlotId: null,
    isRecurring: false,
    $expr: { $lt: ["$bookedCount", "$slotCount"] }
  });

  const recurringTemplates = await AvailabilitySlot.find({
    doctorId,
    isRecurring: true,
    dayOfWeek,
    isDeleted: false,
    parentSlotId: null
  });

  const recurringInstances = await Promise.all(
    recurringTemplates.map((template) =>
      getOrCreateSlotInstance(doctorId, selectedDate, template)
    )
  );

  const existingInstances = await AvailabilitySlot.find({
    doctorId,
    date: { $gte: selectedDate, $lt: nextDate },
    isDeleted: false,
    parentSlotId: { $ne: null },
    $expr: { $lt: ["$bookedCount", "$slotCount"] }
  });

  const slots = [
    ...oneTimeSlots,
    ...recurringInstances,
    ...existingInstances
  ];

  const seen = new Map();
  slots.forEach((slot) => {
    seen.set(slot._id.toString(), slot);
  });

  const now = new Date();
  const validSlots = [...seen.values()].filter((slot) => {
    const slotDateTime = new Date(slot.date);
    const [h, m] = slot.startTime.split(":");
    slotDateTime.setHours(Number.parseInt(h, 10), Number.parseInt(m, 10), 0, 0);
    return slotDateTime >= now;
  });

  return {
    physical: validSlots.filter((s) => s.slotType === "PHYSICAL"),
    online: validSlots.filter((s) => s.slotType === "ONLINE")
  };
};

const resolveSlotsForNextDays = async (doctorId, dayCount = 30) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let physical = [];
  let online = [];

  for (let i = 0; i < dayCount; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const result = await resolveSlotsForDate(doctorId, date);
    physical = physical.concat(result.physical);
    online = online.concat(result.online);
  }

  physical.sort((a, b) => new Date(a.date) - new Date(b.date));
  online.sort((a, b) => new Date(a.date) - new Date(b.date));

  return { physical, online };
};

// GET /api/availability/:doctorId
export const getSlots = async (req, res) => {
  try {
    const slots = await availabilityService.getSlotsByDoctor(req.params.doctorId);
    res.json({ success: true, data: slots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/availability/:doctorId/next
export const getSlotsNextDays = async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;
    const slots = await resolveSlotsForNextDays(req.params.doctorId, days);
    res.json({ success: true, data: slots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/availability/:slotId
export const updateSlot = async (req, res) => {
  try {
    const doctorId = req.user.doctorId || req.user.roleId;
    const updated = await availabilityService.updateSlot(req.params.slotId, req.body, doctorId);

    res.json({
      success: true,
      data: updated,
      message: "Slot updated successfully"
    });
  } catch (err) {
    const status = err.message.startsWith("Forbidden") ? 403 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
};

// DELETE /api/availability/:slotId
export const deleteSlot = async (req, res) => {
  try {
    const doctorId = req.user.doctorId || req.user.roleId;
    await availabilityService.deleteSlot(req.params.slotId, doctorId);

    res.json({ success: true, message: "Slot deleted successfully" });
  } catch (err) {
    const status = err.message.startsWith("Forbidden") ? 403 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
};

// 🔥 Resolves recurring templates into per-date instances + merges one-time slots
export const getSlotsByDoctorAndDate = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    // Timezone-safe date range
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Determine the day-of-week label for matching recurring templates
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfWeek = dayNames[selectedDate.getDay()];

    // --- Fetch 1: One-time slots on the exact date (already instances / non-recurring)
    const oneTimeSlots = await AvailabilitySlot.find({
      doctorId,
      date: { $gte: selectedDate, $lt: nextDate },
      isDeleted: false,
      parentSlotId: null,          // exclude already-created instances (avoid duplication)
      isRecurring: false,
      $expr: { $lt: ["$bookedCount", "$slotCount"] }
    });

    // --- Fetch 2: Recurring templates that match this day of week
    const recurringTemplates = await AvailabilitySlot.find({
      doctorId,
      isRecurring: true,
      dayOfWeek,
      isDeleted: false,
      parentSlotId: null
    });

    // --- Resolve each recurring template into a date-specific instance (lazy creation)
    const instancePromises = recurringTemplates.map(template =>
      getOrCreateSlotInstance(doctorId, selectedDate, template)
    );
    const recurringInstances = await Promise.all(instancePromises);

    // --- Also fetch any already-existing instances for this date (created earlier)
    const existingInstances = await AvailabilitySlot.find({
      doctorId,
      date: { $gte: selectedDate, $lt: nextDate },
      isDeleted: false,
      parentSlotId: { $ne: null },
      $expr: { $lt: ["$bookedCount", "$slotCount"] }
    });

    // Deduplicate: use a Map keyed by _id string
    const seen = new Map();
    [...oneTimeSlots, ...recurringInstances, ...existingInstances].forEach(s => {
      seen.set(s._id.toString(), s);
    });
    const allSlots = [...seen.values()];

    // Filter out expired slots (past date+time)
    const now = new Date();
    const validSlots = allSlots.filter(slot => {
      const slotDateTime = new Date(slot.date);
      const [h, m] = slot.startTime.split(":");
      slotDateTime.setHours(parseInt(h), parseInt(m), 0, 0);
      return slotDateTime >= now;
    });

    // Split by type
    const physical = validSlots.filter(s => s.slotType === "PHYSICAL");
    const online   = validSlots.filter(s => s.slotType === "ONLINE");

    res.json({ physical, online });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//🔥 UPDATED: capacity-based queue booking
export const bookSlot = async (req, res) => {
  try {
    const { doctorId, date, time } = req.body;

    // 🔥 Date range search — handles string vs Date mismatch
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const slot = await AvailabilitySlot.findOne({
      doctorId,
      date: { $gte: selectedDate, $lt: nextDate },
      startTime: time,
      isDeleted: false
    });

    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    // Block booking on raw recurring templates
    if (slot.isRecurring) {
      return res.status(400).json({
        message: "Cannot book a recurring template directly."
      });
    }

    // Check expired
    const now = new Date();
    const slotDateTime = new Date(slot.date);
    const [hours, minutes] = slot.startTime.split(":");
    slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (slotDateTime < now) {
      return res.status(400).json({ message: "This slot has already expired" });
    }

    // Check capacity
    if (slot.bookedCount >= slot.slotCount) {
      return res.status(400).json({ message: "Slot full" });
    }

    slot.bookedCount += 1;
    const queueNumber = slot.bookedCount;

    if (slot.slotType === "ONLINE") {
      slot.isBooked = true;
    } else if (slot.bookedCount >= slot.slotCount) {
      // Mark physical slot as fully booked when capacity is reached
      slot.isBooked = true;
    }

    await slot.save();

    res.json({ message: "Booked successfully", queueNumber });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔓 Release slot capacity (called on appointment cancellation)
export const releaseSlot = async (req, res) => {
  try {
    const { doctorId, date, time } = req.body;

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const slot = await AvailabilitySlot.findOne({
      doctorId,
      date: { $gte: selectedDate, $lt: nextDate },
      startTime: time,
      isDeleted: false
    });

    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    if (slot.bookedCount > 0) {
      slot.bookedCount -= 1;
    }

    // Re-open the slot if it was marked full
    if (slot.bookedCount < slot.slotCount) {
      slot.isBooked = false;
    }

    await slot.save();

    res.json({ message: "Slot released successfully", bookedCount: slot.bookedCount });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};