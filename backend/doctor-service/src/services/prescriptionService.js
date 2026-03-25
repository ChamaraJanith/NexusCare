import Prescription from "../models/Prescription.js";

// CREATE
export const createPrescription = async (data) => {
  return await Prescription.create(data);
};

// READ
export const getByPatient = async (patientId) => {
  return await Prescription.find({ patientId, isDeleted: false });
};

// LIMITED UPDATE
export const updatePrescription = async (id, data) => {
  return await Prescription.findByIdAndUpdate(
    id,
    { ...data, status: "updated" },
    { new: true }
  );
};

// SOFT DELETE (NOT HARD DELETE)
export const deletePrescription = async (id) => {
  return await Prescription.findByIdAndUpdate(
    id,
    { isDeleted: true, status: "cancelled" },
    { new: true }
  );
};