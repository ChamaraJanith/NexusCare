import * as availabilityService from "../services/availabilityService.js";

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