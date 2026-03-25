import * as prescriptionService from "../services/prescriptionService.js";

// CREATE Prescription
export const addPrescription = async (req, res) => {
  try {
    const prescription = await prescriptionService.createPrescription(req.body);

    res.status(201).json({
      success: true,
      data: prescription,
      message: "Prescription created successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// GET Prescriptions by Patient (only active)
export const getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await prescriptionService.getByPatient(req.params.patientId);

    res.json({
      success: true,
      data: prescriptions
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// 🔄 UPDATE (controlled update)
export const updatePrescription = async (req, res) => {
  try {
    const updated = await prescriptionService.updatePrescription(
      req.params.id,
      req.body
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found"
      });
    }

    res.json({
      success: true,
      data: updated,
      message: "Prescription updated (controlled)"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ❌ SOFT DELETE (NOT real delete)
export const deletePrescription = async (req, res) => {
  try {
    const deleted = await prescriptionService.deletePrescription(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found"
      });
    }

    res.json({
      success: true,
      message: "Prescription cancelled (soft deleted)"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};