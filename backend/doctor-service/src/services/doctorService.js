import Doctor from "../models/Doctor.js";

export const createDoctorProfile = async (data) => {
  return await Doctor.create(data);
};

export const getDoctorById = async (id) => {
  return await Doctor.findById(id);
};

export const updateDoctor = async (id, data) => {
  return await Doctor.findByIdAndUpdate(id, data, { new: true });
};

export const deleteDoctor = async (id) => {
  return await Doctor.findByIdAndDelete(id);
};