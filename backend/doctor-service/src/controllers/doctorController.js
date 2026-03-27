import Doctor from "../models/Doctor.js";
import cloudinary from "../config/cloudinary.js";
import * as doctorService from "../services/doctorService.js";

// GET /api/doctors/me
export const getDoctorMe = async (req, res) => {
  try {
    const doctorId = req.user.doctorId || req.user.roleId;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Could not determine doctor ID",
      });
    }

    const bearerToken = req.headers.authorization;

    const profile = await doctorService.getDoctorFullProfile(
      doctorId,
      bearerToken
    );

    console.log("🔥 FINAL PROFILE FROM SERVICE:", profile);

    // 🔥 FINAL NORMALIZATION (NO MORE NULL)
    const fixedProfile = {
      ...profile,

      specialization:
        profile.specialization ||
        profile.specialty ||
        "NOT_FOUND", // debug fallback
    };

    console.log("🔥 FINAL PROFILE SENT:", fixedProfile);

    res.json({
      success: true,
      data: fixedProfile,
    });

  } catch (err) {
    console.error("GET /me ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// UPDATE PROFILE
export const updateDoctorMe = async (req, res) => {
  try {
    const doctorId = req.user.doctorId || req.user.roleId;

    if (!doctorId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const { specialization, experience, hospital, location, bio } = req.body;

    const updateData = {};

    if (specialization) updateData.specialization = specialization;
    if (experience !== undefined) updateData.experience = experience;
    if (hospital) updateData.hospital = hospital;
    if (location) updateData.location = location;
    if (bio) updateData.bio = bio;

    const updated = await doctorService.updateDoctorProfile(
      doctorId,
      updateData
    );

    res.json({
      success: true,
      data: updated,
    });

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// UPLOAD IMAGE
export const uploadProfileImage = async (req, res) => {
  try {
    console.log("FILE DEBUG:", req.file);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const doctorId = req.user.doctorId || req.user.roleId;

    const doctor = await Doctor.findOne({ doctorId });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const imageUrl = req.file.path || req.file.url;
    const publicId =
      req.file.filename ||
      req.file.public_id ||
      req.file.asset_id;

    if (doctor.profileImage?.publicId) {
      await cloudinary.uploader.destroy(doctor.profileImage.publicId);
    }

    doctor.profileImage = {
      url: imageUrl,
      publicId,
    };

    await doctor.save({ validateBeforeSave: false });

    res.json({
      success: true,
      data: doctor.profileImage,
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// GET doctor
export const getDoctor = async (req, res) => {
  try {
    const doctor = await doctorService.getDoctorByDoctorId(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.json({
      success: true,
      data: doctor,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// SEARCH doctors
export const searchDoctors = async (req, res) => {
  try {
    const result = await doctorService.searchDoctors(req.query);

    res.json({
      success: true,
      ...result,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// UPDATE doctor
export const updateDoctor = async (req, res) => {
  try {
    if (req.params.id !== req.user.doctorId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const updated = await doctorService.updateDoctorByDoctorId(
      req.params.id,
      req.body
    );

    res.json({
      success: true,
      data: updated,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};