import Doctor from "../models/Doctor.js";
import AvailabilitySlot from "../models/AvailabilitySlot.js";
import { getUserByToken } from "./userServiceClient.js";

// GET by doctorId (business ID)
export const getDoctorByDoctorId = async (doctorId) => {
  return await Doctor.findOne({ doctorId, isDeleted: false });
};

/**
 * GET full doctor profile by merging:
 * - Doctor record from local DB (specialization, experience, hospital, bio)
 * - User identity from user-patient-service (name, email, profileImage)
 */
export const getDoctorFullProfile = async (doctorId, bearerToken) => {
  // Fetch both in parallel
  const [doctorRecord, userIdentity] = await Promise.all([
    getDoctorByDoctorId(doctorId),
    getUserByToken(bearerToken),
  ]);

  console.log("[doctorService] doctorRecord:", doctorRecord);
  console.log("[doctorService] userIdentity:", userIdentity);

  // Build merged profile
  return {
    doctorId,
    // Identity fields from user-patient-service
    name: userIdentity?.name || null,
    email: userIdentity?.email || null,
    profileImage: userIdentity?.profileImage || null,
    phone: userIdentity?.phone || null,
    // Professional fields from doctor-service DB
    specialization: doctorRecord?.specialization || null,
    qualifications: doctorRecord?.qualifications || null,
    experience: doctorRecord?.experience || null,
    hospital: doctorRecord?.hospital || null,
    location: doctorRecord?.location || null,
    bio: doctorRecord?.bio || null,
    isActive: doctorRecord?.isActive ?? true,
  };
};


// UPDATE by doctorId
export const updateDoctorByDoctorId = async (doctorId, data) => {
  return await Doctor.findOneAndUpdate(
    { doctorId, isDeleted: false },
    data,
    { new: true, runValidators: true }
  );
};

// GET ALL
export const getAllDoctors = async (filter = {}) => {
  return await Doctor.find({ isDeleted: false, ...filter });
};

// 🔍 SEARCH + FILTER + PAGINATION + ADVANCED
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

  const query = { isDeleted: false, isActive: true };

  // 🔍 FULL-TEXT SEARCH
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

  // ⏰ Availability filter
  if (available === "true") {
    const slots = await AvailabilitySlot.find({ isBooked: false }).select("doctorId");
    const doctorIds = [...new Set(slots.map(slot => slot.doctorId))];

    if (doctorIds.length > 0) {
      query.doctorId = { $in: doctorIds };
    } else {
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