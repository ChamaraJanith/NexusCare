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

// GET /api/availability/:doctorId
export const getSlots = async (req, res) => {
  try {
    const slots = await availabilityService.getSlotsByDoctor(req.params.doctorId);
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

    // 1. Find the target slot
    const slot = await AvailabilitySlot.findOne({
      doctorId,
      date: new Date(date),
      startTime: time,
      isDeleted: false
    });

    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    // 2. Block booking on raw recurring templates — always book instances
    if (slot.isRecurring) {
      return res.status(400).json({
        message: "Cannot book a recurring template directly. Select a specific date slot."
      });
    }

    // 2. Block booking if slot has already expired
    const now = new Date();
    const slotDateTime = new Date(slot.date);
    const [hours, minutes] = slot.startTime.split(":");
    slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (slotDateTime < now) {
      return res.status(400).json({ message: "This slot has already expired" });
    }

    // 3. Check capacity
    if (slot.bookedCount >= slot.slotCount) {
      return res.status(400).json({ message: "Slot full" });
    }

    // 3. Increment bookedCount and assign queue number
    slot.bookedCount += 1;
    const queueNumber = slot.bookedCount;

    // 4. For ONLINE slots: mark isBooked for backward compatibility
    if (slot.slotType === "ONLINE") {
      slot.isBooked = true;
    }

    await slot.save();

    res.json({
      message: "Booked successfully",
      queueNumber
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};