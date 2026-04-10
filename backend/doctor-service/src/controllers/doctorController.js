import Doctor from "../models/Doctor.js";
import * as doctorService from "../services/doctorService.js";
import * as videoSyncClient from "../services/videoSyncClient.js";
import * as videoCatalogSyncService from "../services/videoCatalogSyncService.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

const streamUpload = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "nexuscare/doctors" },
      (error, result) => {
        if (result) resolve(result);
        else reject(new Error(error?.message || 'Upload failed'));
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

const buildDoctorSyncPayload = (doctorRecord, identity = {}) => {
  if (!doctorRecord?.doctorId) {
    return null;
  }

  return {
    doctorId: doctorRecord.doctorId,
    name: identity.name || `Doctor ${doctorRecord.doctorId}`,
    email: identity.email || null,
    specialization: doctorRecord.specialty || doctorRecord.specialization || identity.specialization || null,
    hospital: doctorRecord.hospital || identity.hospital || null,
    location: doctorRecord.location || identity.location || null,
    profileImage: doctorRecord.profileImage || identity.profileImage || null,
    isActive: doctorRecord.isActive !== false,
  };
};

// ─── GET /api/doctors/me ──────────────────────────────────────────────────────
export const getDoctorMe = async (req, res) => {
  try {
    const doctorId = req.user.doctorId || req.user.roleId;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Could not determine doctor ID from token",
      });
    }

    const bearerToken = req.headers.authorization;
    const profile = await doctorService.getDoctorFullProfile(doctorId, bearerToken);

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (err) {
    console.error("[getDoctorMe] ERROR:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ─── PUT /api/doctors/me ──────────────────────────────────────────────────────
/**
 * Upsert the editable professional fields for the authenticated doctor.
 * Specialization is editable and stored in MS2.
 */
export const updateDoctorMe = async (req, res) => {
  try {
    const doctorId = req.user.doctorId || req.user.roleId;

    if (!doctorId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: no doctorId in token",
      });
    }

    const { specialization, experience, hospital, location, bio } = req.body;

    const updateData = {};
    if (specialization !== undefined) updateData.specialty = specialization;
    if (experience !== undefined && experience !== null) {
      const num = Number(experience);

      if (!Number.isNaN(num)) {
        updateData.experience = num;
      }
    }
    if (hospital !== undefined) updateData.hospital = hospital;
    if (location !== undefined) updateData.location = location;
    if (bio !== undefined) updateData.bio = bio;

    // Upsert — creates record if it doesn't exist yet
    const updated = await doctorService.updateDoctorProfile(doctorId, updateData);
    
    console.log("UPDATE DATA:", updateData);

    const identity = await doctorService.getDoctorFullProfile(doctorId, req.headers.authorization).catch((err) => {
      console.warn("[updateDoctorMe] getDoctorFullProfile failed:", err.message);
      return null;
    });

    const syncPayload = buildDoctorSyncPayload(updated, identity || {});
    if (syncPayload) {
      videoSyncClient.syncDoctor(syncPayload).catch((err) => console.warn("[updateDoctorMe] video sync failed:", err.message));
    }

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    console.error("[updateDoctorMe] ERROR:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
  
};

// ─── POST /api/doctors/me/image ───────────────────────────────────────────────
/**
 * Upload / replace the doctor's profile image.
 * Uses upsert so it works even if the doctor has no MS2 record yet.
 */
export const uploadProfileImage = async (req, res) => {
  try {
    // ── DEBUG: log request pipeline state ──
    console.log("[uploadProfileImage] ── REQUEST DEBUG ──");
    console.log("[uploadProfileImage] req.user:", req.user);
    if (req.file) {
      console.log("[uploadProfileImage] file info:", {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    }
    console.log("[uploadProfileImage] content-type:", req.headers["content-type"]);
    console.log("[uploadProfileImage] req.body keys:", Object.keys(req.body || {}));

    // ── Validate auth ──
    if (!req.user) {
      console.error("[uploadProfileImage] FAIL: req.user is missing — auth middleware did not run");
      return res.status(401).json({
        success: false,
        message: "Unauthorized: no user context",
      });
    }

    // ── Validate file ──
    if (!req.file) {
      console.error("[uploadProfileImage] FAIL: req.file is missing — multer did not process any file");
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Ensure the field name is 'image' and the request is multipart/form-data.",
      });
    }

    const doctorId = req.user.doctorId || req.user.roleId;
    console.log("[uploadProfileImage] Resolved doctorId:", doctorId);

    if (!doctorId) {
      console.error("[uploadProfileImage] FAIL: no doctorId in token payload");
      return res.status(403).json({
        success: false,
        message: "Forbidden: no doctorId in token",
      });
    }

    // Upload directly to Cloudinary from memory buffer
    const result = await streamUpload(req.file.buffer);
    const imageUrl = result.secure_url;
    console.log("[uploadProfileImage] Cloudinary imageUrl to save:", imageUrl);

    // ── Verify doctor exists before update ──
    const existingDoc = await Doctor.findOne({ doctorId });
    console.log("[uploadProfileImage] Existing doctor record:", existingDoc ? "FOUND" : "NOT FOUND (will upsert)");

    const updated = await doctorService.updateProfileImage(doctorId, imageUrl);
    console.log("[uploadProfileImage] DB update result:", JSON.stringify(updated, null, 2));

    const identity = await doctorService.getDoctorFullProfile(doctorId, req.headers.authorization).catch((err) => {
      console.warn("[uploadProfileImage] getDoctorFullProfile failed:", err.message);
      return null;
    });

    const syncPayload = buildDoctorSyncPayload(updated, identity || {});
    if (syncPayload) {
      videoSyncClient.syncDoctor(syncPayload).catch((err) => console.warn("[uploadProfileImage] video sync failed:", err.message));
    }

    return res.status(200).json({
      success: true,
      data: updated?.profileImage || imageUrl,
    });
  } catch (err) {
    console.error("[uploadProfileImage] ERROR:", err);
    console.error("[uploadProfileImage] ERROR stack:", err.stack);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ─── GET /api/doctors/internal/:id ────────────────────────────────────────────
export const getDoctorInternal = async (req, res) => {
  try {
    const internalKey = req.headers["x-internal-service-key"];
    if (internalKey !== process.env.INTERNAL_SERVICE_KEY) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const doctorId = req.params.id;
    const doctor = await doctorService.getDoctorByDoctorId(doctorId);
    const user = await mongoose.connection.collection("users").findOne(
      { roleId: doctorId },
      { projection: { email: 1, name: 1, phone: 1 } }
    );

    if (!doctor && !user) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        doctorId,
        email: user?.email || null,
        name: user?.name || null,
        phone: user?.phone || null,
        profile: doctor || null,
      },
    });
  } catch (err) {
    console.error("[getDoctorInternal] ERROR:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/doctors/:id ─────────────────────────────────────────────────────
export const getDoctor = async (req, res) => {
  try {
    const doctor = await doctorService.getDoctorByDoctorId(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ─── POST /api/doctors/sync/full ─────────────────────────────────────────────
export const syncDoctorCatalog = async (req, res) => {
  try {
    const result = await videoCatalogSyncService.syncFullDoctorCatalog();
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("[syncDoctorCatalog] ERROR:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/doctors/search ──────────────────────────────────────────────────
export const searchDoctors = async (req, res) => {
  try {
      const { name, search, specialty, specialization, hospital, date } = req.query;
      const searchTerm = name || search || "";

      const inputSpecialty = specialty || specialization;
      const matchStage = {};

      if (inputSpecialty) {
        const normalized = inputSpecialty.toLowerCase();
        let keyword = inputSpecialty;

        if (normalized === "cardiology") keyword = "cardio";
        if (normalized === "dermatology") keyword = "dermato";

        matchStage.specialty = {
          $regex: keyword,
          $options: "i"
        };
      }

      const pipeline = [
        { $match: matchStage },
        {
          $lookup: {
            from: "users",
            localField: "doctorId",
            foreignField: "roleId",
            as: "user"
          }
        },
        {
          $lookup: {
            from: "availabilityslots",
            localField: "doctorId",
            foreignField: "doctorId",
            as: "slots"
          }
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true
          }
        }
      ];

      if (searchTerm) {
        pipeline.push({
          $match: {
            $or: [
              {
                "user.name": {
                  $regex: searchTerm,
                  $options: "i"
                }
              },
              {
                name: {
                  $regex: searchTerm,
                  $options: "i"
                }
              },
              {
                doctorId: {
                  $regex: searchTerm,
                  $options: "i"
                }
              },
              {
                "user.email": {
                  $regex: searchTerm,
                  $options: "i"
                }
              },
              {
                email: {
                  $regex: searchTerm,
                  $options: "i"
                }
              }
            ]
          }
        });
      }

    if (hospital) {
      pipeline.push({
        $match: {
          "slots.hospital": {
            $regex: hospital,
            $options: "i"
          }
        }
      });
    }

    if (date) {
      pipeline.push({
        $match: {
          "slots.date": new Date(date)
        }
      });
    }

    pipeline.push({
      $project: {
        doctorId: 1,
        specialty: 1,
        hospital: 1,
        experience: 1,
        consultationFee: 1,
        name: "$user.name",
        email: "$user.email",
        isActive: "$user.isActive",
        isVerified: "$user.isVerified",
        createdAt: "$user.createdAt",
        profileImage: {
          $ifNull: ["$profileImage", "$user.profileImage"]
        },
        slots: 1,
        role: { $literal: "doctor" }
      }
    });

    const doctors = await Doctor.aggregate(pipeline);

    console.log("PIPELINE:", JSON.stringify(pipeline, null, 2));
    console.log("DOCTORS:", doctors);

    return res.status(200).json(doctors);
  } catch (err) {
    console.error("[searchDoctors] ERROR:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ─── PUT /api/doctors/:id (admin) ─────────────────────────────────────────────
export const updateDoctor = async (req, res) => {
  try {
    if (req.params.id !== (req.user.doctorId || req.user.roleId)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const updated = await doctorService.updateDoctorByDoctorId(req.params.id, req.body);

    const syncPayload = buildDoctorSyncPayload(updated, {});
    if (syncPayload) {
      videoSyncClient.syncDoctor(syncPayload).catch((err) => console.warn("[updateDoctor] video sync failed:", err.message));
    }

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};