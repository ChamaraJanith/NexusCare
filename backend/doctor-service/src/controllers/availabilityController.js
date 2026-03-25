import * as availabilityService from "../services/availabilityService.js";

// CREATE
export const createSlot = async (req, res) => {
  try {
    const slot = await availabilityService.addSlot(req.body);
    res.status(201).json(slot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// READ
export const getSlots = async (req, res) => {
  try {
    const slots = await availabilityService.getSlotsByDoctor(req.params.doctorId);
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE 🔥
export const updateSlot = async (req, res) => {
  try {
    const updated = await availabilityService.updateSlot(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE 🔥
export const deleteSlot = async (req, res) => {
  try {
    await availabilityService.deleteSlot(req.params.id);
    res.json({ message: "Slot deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};