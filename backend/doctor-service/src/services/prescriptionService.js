import Prescription from "../models/Prescription.js";

// CREATE
export const createPrescription = async (data, user) => {
  if (user.role !== "doctor") {
    throw new Error("Only doctors can create prescriptions");
  }

  const doctorId = user.doctorId || user.id; // 🔥 SAFE FIX

  return await Prescription.create({
    ...data,
    doctorId
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

  const doctorId = user.doctorId || user.id; // 🔥 SAFE FIX

  if (prescription.doctorId !== doctorId) {
    throw new Error("Unauthorized");
  }

  return await Prescription.findByIdAndUpdate(
    id,
    { ...data, status: "updated" },
    {
      returnDocument: "after", // 🔥 modern fix
      runValidators: true
    }
  );
};

// SOFT DELETE
export const deletePrescription = async (id, user) => {
  const prescription = await Prescription.findById(id);
  if (!prescription || prescription.isDeleted) return null;

  const doctorId = user.doctorId || user.id; // 🔥 SAFE FIX

  if (prescription.doctorId !== doctorId) {
    throw new Error("Unauthorized");
  }

  return await Prescription.findByIdAndUpdate(
    id,
    { isDeleted: true, status: "cancelled" },
    {
      returnDocument: "after" // 🔥 modern fix
    }
  );
};