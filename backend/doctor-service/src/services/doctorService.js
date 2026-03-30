import Doctor from "../models/Doctor.js";
import AvailabilitySlot from "../models/AvailabilitySlot.js";
import { getUserByToken, searchDoctorsByName } from "./userServiceClient.js";
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
 * Orchestrates cross-service identity hydration to avoid N+1 queries.
 */
export const searchDoctors = async (queryParams) => {
  try {
    const params = queryParams.query ? queryParams.query : queryParams;

    const dbQuery = { isDeleted: false };
    const andConditions = [];

    // 1. MS2 Text Field Filters
    // Note: Mongoose schema uses "specialty", not "specialization"
    if (params.specialization) {
      andConditions.push({ specialty: { $regex: params.specialization.trim(), $options: "i" } });
    }
    if (params.hospital) {
      andConditions.push({ hospital: { $regex: params.hospital.trim(), $options: "i" } });
    }
    if (params.location) {
      andConditions.push({ location: { $regex: params.location.trim(), $options: "i" } });
    }

    // 2. Identity Resolution & Name Filtering (MS1)
    // Fetch MS1 identities. If params.name exists, MS1 pre-filters it using regex.
    // Otherwise, it returns all active doctors for O(1) payload hydration.
    // Wrapped in try-catch: if MS1 is down, return safe empty fallback rather than crashing.
    let ms1Identities = [];
    try {
      ms1Identities = await searchDoctorsByName(params.name ? params.name.trim() : "");
    } catch (err) {
      console.error("[MS1 ERROR] searchDoctorsByName failed:", err.message);
      return { data: [] }; // safe fallback — MS1 unreachable
    }
    if (!ms1Identities || ms1Identities.length === 0) return { data: [] };

    const ms1Dict = {};
    const ms1Ids = [];
    ms1Identities.forEach((d) => {
      ms1Dict[d.doctorId] = d;
      ms1Ids.push(d.doctorId);
    });

    // 3. Date & Availability Filtering
    let availableIds = null;
    let slotIds = null;

    if (params.date) {
      // Timezone-safe date range: use $gte start-of-day and $lt start-of-next-day
      // Avoids single-point match bugs caused by UTC offset differences
      const selectedDate = new Date(params.date);
      selectedDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const strictSlots = await AvailabilitySlot.find({
        date: { $gte: selectedDate, $lt: nextDate },
        isBooked: false,
        isDeleted: false,
      }).select("doctorId");

      slotIds = [...new Set(strictSlots.map((s) => s.doctorId))];
      if (slotIds.length === 0) return { data: [] };
    }

    // 4. Resolve Aggregate Intersections
    if (slotIds !== null) {
      // Intersect MS1 name hits with MS2 strict slot hits
      // Uses Set for O(n) lookup instead of O(n²) Array.includes()
      const slotSet = new Set(slotIds);
      const intersect = ms1Ids.filter(id => slotSet.has(id));
      if (intersect.length === 0) return { data: [] };
      andConditions.push({ doctorId: { $in: intersect } });
    } else {
      // Just constrain strictly to known MS1 identities
      andConditions.push({ doctorId: { $in: ms1Ids } });
    }

    if (andConditions.length > 0) {
      dbQuery.$and = andConditions;
    }

    // 5. Query Core Profiles (MS2)
    const rawDoctors = await Doctor.find(dbQuery).lean();
    if (rawDoctors.length === 0) return { data: [] };

    // 6. Generic Availability Flagging
    // Determine the 'isAvailable' boundary for all returned records
    let availableDoctorIdsSet;
    if (params.date) {
      // Since we strictly filtered by date above, all returned doctors are inherently available
      availableDoctorIdsSet = new Set(rawDoctors.map(d => d.doctorId));
    } else {
      // Pull forward-looking generalized slot availability
      const futureSlots = await AvailabilitySlot.find({
        isBooked: false,
        isDeleted: false,
        date: { $gte: new Date().setHours(0, 0, 0, 0) }
      }).select("doctorId");
      availableDoctorIdsSet = new Set(futureSlots.map(s => s.doctorId));
    }

    // 7. Data Hydration & Return formatting
    const hydratedDoctors = rawDoctors.map((doc) => {
      const identity = ms1Dict[doc.doctorId] || {};
      return {
        ...doc,
        name: identity.name || `Doctor ${doc.doctorId}`,
        profileImage: doc.profileImage?.url ? doc.profileImage : (identity.profileImage || null),
        isAvailable: availableDoctorIdsSet.has(doc.doctorId),
      };
    });

    return { data: hydratedDoctors };
  } catch (error) {
    console.error("[searchDoctors] error:", error);
    throw error;
  }
};