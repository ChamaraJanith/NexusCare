import Prescription from "../models/Prescription.js";

// CREATE
export const createPrescription = async (data, user) => {
  if (user.role !== "doctor") {
    throw new Error("Only doctors can create prescriptions");
  }

  return await Prescription.create({
    ...data,
    doctorId: user.id
  });
};

// READ
export const getByPatient = async (patientId) => {
  return await Prescription.find({
    patientId,
    isDeleted: false
  });
};

// UPDATE
export const updatePrescription = async (id, data, user) => {
  const prescription = await Prescription.findById(id);
  if (!prescription || prescription.isDeleted) return null;

  if (prescription.doctorId !== user.id) {
    throw new Error("Unauthorized");
  }

  return await Prescription.findByIdAndUpdate(
    id,
    { ...data, status: "updated" },
    { new: true, runValidators: true }
  );
};

// SOFT DELETE
export const deletePrescription = async (id, user) => {
  const prescription = await Prescription.findById(id);
  if (!prescription || prescription.isDeleted) return null;

  if (prescription.doctorId !== user.id) {
    throw new Error("Unauthorized");
  }

  return await Prescription.findByIdAndUpdate(
    id,
    { isDeleted: true, status: "cancelled" },
    { new: true }
  );
};