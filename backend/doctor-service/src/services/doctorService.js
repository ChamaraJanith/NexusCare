import Doctor from "../models/Doctor.js";
import AvailabilitySlot from "../models/AvailabilitySlot.js";
import { getUserByToken } from "./userServiceClient.js";
import cloudinary from "../config/cloudinary.js";

// ─── READ ────────────────────────────────────────────────────────────────────

/** Get MS2 professional record by doctorId (returns null if not yet created). */
export const getDoctorByDoctorId = async (doctorId) => {
  return await Doctor.findOne({ doctorId, isDeleted: false });
};

export const getDoctorFullProfile = async (doctorId, bearerToken) => {
  const doctorRecord = await Doctor.findOne({ doctorId });

  // Safely wrap MS1 call
  const userIdentity = await getUserByToken(bearerToken).catch(err => {
    console.warn("[getDoctorFullProfile] getUserByToken failed:", err.message);
    return null;
  });

  console.log("DB specialization:", doctorRecord?.specialization);
  console.log("MS1 specialty:", userIdentity?.specialty);
  console.log("MS1 hospital:", userIdentity?.hospital);
  console.log("MS1 userIdentity:", userIdentity);

  return {
    doctorId,
    name: userIdentity?.name || `Doctor ${doctorId}`,
    email: userIdentity?.email || "",
    phone: userIdentity?.phone || "",
    specialization: doctorRecord?.specialty || userIdentity?.specialty || "",
    experience: doctorRecord?.experience || 0,
    hospital: doctorRecord?.hospital || userIdentity?.hospital || "",
    location: doctorRecord?.location || "",
    bio: doctorRecord?.bio || "",
    profileImage: doctorRecord?.profileImage?.url ? doctorRecord.profileImage : (userIdentity?.profileImage || null),
    isActive: doctorRecord?.isActive !== undefined ? doctorRecord.isActive : true,
  };
};

// ─── WRITE ───────────────────────────────────────────────────────────────────

export const updateDoctorProfile = async (doctorId, updateData) => {

  console.log("RAW UPDATE DATA:", updateData);

  const cleanData = {};

  Object.keys(updateData).forEach((key) => {
    let value = updateData[key];

    // 🔥 FIX 1: handle null/undefined
    if (value === undefined || value === null) return;

    // 🔥 FIX 2: ensure number type
    if (key === "experience") {
      value = Number(value);
      if (isNaN(value)) return;
    }

    cleanData[key] = value;
  });

  if (cleanData.specialization !== undefined) {
    cleanData.specialty = cleanData.specialization;
  }

  console.log("CLEAN DATA:", cleanData);

  return await Doctor.findOneAndUpdate(
    { doctorId },
    { $set: cleanData },
    {
      returnDocument: "after",
      runValidators: true,
      upsert: true,
    }
  );
};

/** Generic update by doctorId (admin use). */
export const updateDoctorByDoctorId = async (doctorId, data) => {
  return await Doctor.findOneAndUpdate(
    { doctorId, isDeleted: false },
    { $set: data },
    { new: true, runValidators: true }
  );
};

/**
 * Upsert profile image.
 * Works even when the MS2 doctor record doesn't exist yet (new doctor).
 * Cleans up old Cloudinary image if one is being replaced.
 */
export const updateProfileImage = async (doctorId, fileUrl, publicId) => {
  const existing = await getDoctorByDoctorId(doctorId);

  if (existing?.profileImage?.publicId) {
    try {
      await cloudinary.uploader.destroy(existing.profileImage.publicId);
    } catch (err) {
      console.error("[Cloudinary] Failed to delete old image:", err.message);
    }
  }

  return await Doctor.findOneAndUpdate(
    { doctorId, isDeleted: false },
    {
      $set: { profileImage: { url: fileUrl, publicId } },
      $setOnInsert: { doctorId },
    },
    {
      new: true,
      upsert: true,
    }
  );
};

// ─── LIST / SEARCH ───────────────────────────────────────────────────────────

export const getAllDoctors = async (filter = {}) => {
  return await Doctor.find({ isDeleted: false, ...filter });
};

/**
 * Search doctors with filters (specialization, hospital, location, date).
 */
export const searchDoctors = async (queryParams) => {
  try {
    const params = queryParams.query ? queryParams.query : queryParams;

    const query = { isDeleted: false };

    if (params.specialization) {
      query.specialization = { $regex: params.specialization.trim(), $options: "i" };
    }

    if (params.hospital) {
      query.hospital = { $regex: params.hospital.trim(), $options: "i" };
    }

    if (params.location) {
      query.location = { $regex: params.location.trim(), $options: "i" };
    }

    if (params.date) {
      const slots = await AvailabilitySlot.find({
        date: params.date,
        isBooked: false,
      }).select("doctorId");

      const doctorIds = [...new Set(slots.map((s) => s.doctorId))];

      if (doctorIds.length > 0) {
        query.doctorId = { $in: doctorIds };
      } else {
        return { data: [] };
      }
    }

    const doctors = await Doctor.find(query);

    return { data: doctors };
  } catch (error) {
    console.error("[searchDoctors] error:", error);
    throw error;
  }
};