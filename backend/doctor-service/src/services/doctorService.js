import Doctor from "../models/Doctor.js";
import AvailabilitySlot from "../models/AvailabilitySlot.js";

// CREATE
export const createDoctorProfile = async (data) => {
  return await Doctor.create(data);
};

// 🔥 GET by USER ID (important for duplicate check)
export const getDoctorByUserId = async (userId) => {
  return await Doctor.findOne({ userId, isDeleted: false });
};

// GET by ID (only active doctors)
export const getDoctorById = async (id) => {
  return await Doctor.findOne({ _id: id, isDeleted: false });
};

// 🔥 GET by doctorId (business ID)
export const getDoctorByDoctorId = async (doctorId) => {
  return await Doctor.findOne({ doctorId, isDeleted: false });
};

// UPDATE (only active doctors)
export const updateDoctor = async (id, data) => {
  return await Doctor.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true, runValidators: true } // 🔥 validation on update
  );
};

// SOFT DELETE ❌
export const deleteDoctor = async (id) => {
  return await Doctor.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
};

// GET ALL
export const getAllDoctors = async (filter = {}) => {
  return await Doctor.find({ isDeleted: false, ...filter });
};

// 🔍 SEARCH + FILTER + PAGINATION + ADVANCED 🔥
export const searchDoctors = async (queryParams) => {
  const {
    search,
    specialization,
    location,
    available,
    minExp,
    maxExp,
    page = 1,
    limit = 10,
    sort = "createdAt",
    order = "asc"
  } = queryParams;

  const query = { isDeleted: false };

  // 🔍 FULL-TEXT SEARCH (fallback to regex if needed)
  if (search) {
    query.$text = { $search: search };
  }

  // 📍 Location filter
  if (location) {
    query.location = { $regex: location, $options: "i" };
  }

  // 🎯 Specialization filter
  if (specialization) {
    query.specialization = specialization;
  }

  // 📊 Experience range filter
  if (minExp || maxExp) {
    query.experience = {};
    if (minExp) query.experience.$gte = Number(minExp);
    if (maxExp) query.experience.$lte = Number(maxExp);
  }

  // ⏰ Availability filter (optimized)
  if (available === "true") {
    const slots = await AvailabilitySlot.find({ isBooked: false }).select("doctorId");

    const doctorIds = [...new Set(slots.map(slot => slot.doctorId))];

    if (doctorIds.length > 0) {
      query._id = { $in: doctorIds };
    } else {
      // 🔥 no available doctors
      return {
        total: 0,
        page: Number(page),
        limit: Number(limit),
        totalPages: 0,
        data: []
      };
    }
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sortOrder = order === "desc" ? -1 : 1;

  const doctors = await Doctor.find(query)
    .sort({ [sort]: sortOrder })
    .skip(skip)
    .limit(Number(limit));

  const total = await Doctor.countDocuments(query);

  return {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
    data: doctors
  };
};