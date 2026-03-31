import Doctor from "../models/Doctor.js";
import cloudinary from "../config/cloudinary.js";
import * as doctorService from "../services/doctorService.js";

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

      if (!isNaN(num)) {
        updateData.experience = num;
      }
    }
    if (hospital !== undefined) updateData.hospital = hospital;
    if (location !== undefined) updateData.location = location;
    if (bio !== undefined) updateData.bio = bio;

    // Upsert — creates record if it doesn't exist yet
    const updated = await doctorService.updateDoctorProfile(doctorId, updateData);
    
    console.log("UPDATE DATA:", updateData);

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
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const doctorId = req.user.doctorId || req.user.roleId;

    if (!doctorId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: no doctorId in token",
      });
    }

    const imageUrl = req.file.path || req.file.url;
    const publicId = req.file.filename || req.file.public_id || req.file.asset_id;

    // Upsert profile image (handles old-image cleanup internally)
    const updated = await doctorService.updateProfileImage(doctorId, imageUrl, publicId);

    return res.status(200).json({
      success: true,
      data: updated?.profileImage || { url: imageUrl, publicId },
    });
  } catch (err) {
    console.error("[uploadProfileImage] ERROR:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
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

// ─── GET /api/doctors/search ──────────────────────────────────────────────────
export const searchDoctors = async (req, res) => {
  try {
    const { name, specialty, specialization, hospital, date } = req.query;

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
      { $unwind: "$user" }
    ];

    if (name) {
      pipeline.push({
        $match: {
          "user.name": {
            $regex: name,
            $options: "i"
          }
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
        profileImage: "$user.profileImage",
        slots: 1
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