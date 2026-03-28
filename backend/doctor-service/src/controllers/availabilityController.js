import * as availabilityService from "../services/availabilityService.js";
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

// 🔥 NEW: get slots by doctor + date + split types
export const getSlotsByDoctorAndDate = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    const slots = await AvailabilitySlot.find({
      doctorId,
      date: new Date(date),
      isDeleted: false,
      isBooked: false
    });

    // 🔥 SPLIT TYPES
    const physical = slots.filter(s => s.slotType === "PHYSICAL");
    const online = slots.filter(s => s.slotType === "ONLINE");

    res.json({
      physical,
      online
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//🔥 NEW: lock slot when appointment created
export const bookSlot = async (req, res) => {
  try {
    const { doctorId, date, time } = req.body;

    const slot = await AvailabilitySlot.findOneAndUpdate(
      {
        doctorId,
        date: new Date(date),
        startTime: time,
        isBooked: false
      },
      { isBooked: true },
      { new: true }
    );

    if (!slot) {
      return res.status(400).json({ message: "Slot already booked" });
    }

    res.json({ message: "Slot booked" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};