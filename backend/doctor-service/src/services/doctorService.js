import Doctor from "../models/Doctor.js";
import AvailabilitySlot from "../models/AvailabilitySlot.js";
import { getUserByToken } from "./userServiceClient.js";
import cloudinary from "../config/cloudinary.js";
// Force restart: 1

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

    // Identity fields
    name: userIdentity?.name || null,
    email: userIdentity?.email || null,
    profileImage: doctorRecord?.profileImage?.url
      ? doctorRecord.profileImage
      : (userIdentity?.profileImage || null),
    phone: userIdentity?.phone || null,

    // 🔥 FIXED PROFESSIONAL FIELDS
    specialization:
      doctorRecord?.specialization ||
      doctorRecord?.specialty ||
      null,

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

// UPDATE Doctor Profile details
export const updateDoctorProfile = async (doctorId, updateData) => {
  return await Doctor.findOneAndUpdate(
    { doctorId, isDeleted: false },
    updateData,
    { new: true, runValidators: true }
  );
};

// UPDATE Profile Image
export const updateProfileImage = async (doctorId, fileUrl, publicId) => {
  const doctor = await getDoctorByDoctorId(doctorId);
  if (!doctor) throw new Error("Doctor not found");

  // If there's an existing image, delete it from Cloudinary
  if (doctor.profileImage && doctor.profileImage.publicId) {
    try {
      await cloudinary.uploader.destroy(doctor.profileImage.publicId);
    } catch (err) {
      console.error("[Cloudinary] Failed to delete old image:", err);
    }
  }

  // Save new image details
  doctor.profileImage = { url: fileUrl, publicId };
  return await doctor.save();
};

// GET ALL
export const getAllDoctors = async (filter = {}) => {
  return await Doctor.find({ isDeleted: false, ...filter });
};

//search doctors with filters
export const searchDoctors = async (queryParams) => {
  try {
    const params = queryParams.query ? queryParams.query : queryParams;

    console.log("🔥 PARAMS:", params);

    const query = {};

    // 🔥 SIMPLE & SAFE FILTER
    if (params.specialty) {
      query.specialty = {
        $regex: params.specialty.trim(),
        $options: "i"
      };
    }

    if (params.hospital) {
      query.hospital = {
        $regex: params.hospital.trim(),
        $options: "i"
      };
    }

    // NAME FILTER (optional)
if (params.name) {
  query.$text = { $search: params.name };
}

// DATE FILTER (important)
if (params.date) {
  const slots = await AvailabilitySlot.find({
    date: params.date,
    isBooked: false
  }).select("doctorId");

  const doctorIds = [...new Set(slots.map(s => s.doctorId))];

  if (doctorIds.length > 0) {
    query.doctorId = { $in: doctorIds };
  } else {
    return { data: [] };
  }
}

    const doctors = await Doctor.find(query);

    console.log("✅ FOUND:", doctors.length);

    return {
      data: doctors
    };

  } catch (error) {
    console.error("❌ ERROR:", error);
    throw error;
  }
};