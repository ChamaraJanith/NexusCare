import * as availabilityService from "../services/availabilityService.js";

// CREATE
export const createSlot = async (req, res) => {
  try {
    const slot = await availabilityService.addSlot(req.body, req.user.id);

    res.status(201).json({
      success: true,
      data: slot,
      message: "Slot created successfully"
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// READ
export const getSlots = async (req, res) => {
  try {
    const slots = await availabilityService.getSlotsByDoctor(req.params.doctorId);

    res.json({
      success: true,
      data: slots
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// UPDATE
export const updateSlot = async (req, res) => {
  try {
    const updated = await availabilityService.updateSlot(
      req.params.id,
      req.body,
      req.user.id
    );

    res.json({
      success: true,
      data: updated,
      message: "Slot updated"
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// DELETE
export const deleteSlot = async (req, res) => {
  try {
    await availabilityService.deleteSlot(req.params.id, req.user.id);

    res.json({
      success: true,
      message: "Slot deleted (soft delete)"
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};