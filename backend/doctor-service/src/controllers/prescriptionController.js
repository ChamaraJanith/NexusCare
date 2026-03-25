import * as prescriptionService from "../services/prescriptionService.js";

// CREATE
export const addPrescription = async (req, res) => {
  try {
    const prescription = await prescriptionService.createPrescription(
      req.body,
      req.user
    );

    res.status(201).json({
      success: true,
      data: prescription,
      message: "Prescription created"
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// READ
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

// UPDATE
export const updatePrescription = async (req, res) => {
  try {
    const updated = await prescriptionService.updatePrescription(
      req.params.id,
      req.body,
      req.user
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
      message: "Prescription updated"
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// DELETE
export const deletePrescription = async (req, res) => {
  try {
    const deleted = await prescriptionService.deletePrescription(
      req.params.id,
      req.user
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found"
      });
    }

    res.json({
      success: true,
      message: "Prescription cancelled"
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};