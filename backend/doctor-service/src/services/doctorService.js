import Doctor from "../models/Doctor.js";

// CREATE
export const createDoctorProfile = async (data) => {
  return await Doctor.create(data);
};

// GET by ID (only active doctors)
export const getDoctorById = async (id) => {
  return await Doctor.findOne({ _id: id, isDeleted: false });
};

// UPDATE (only active doctors)
export const updateDoctor = async (id, data) => {
  return await Doctor.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true }
  );
};

// SOFT DELETE ❌ (not hard delete)
export const deleteDoctor = async (id) => {
  return await Doctor.findOneAndUpdate(
    { _id: id },
    { isDeleted: true },
    { new: true }
  );
};

// (OPTIONAL 🔥) Get all doctors (for search/list)
export const getAllDoctors = async (filter = {}) => {
  return await Doctor.find({ isDeleted: false, ...filter });
};