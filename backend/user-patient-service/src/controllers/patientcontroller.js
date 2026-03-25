// Patient controller - manages patient profiles, medical reports, and prescriptions
const User = require("../models/User");
const PatientProfile = require("../models/PatientProfile");
const cloudinary = require("../config/cloudinary");
const { v4: uuidv4 } = require("uuid");

// ─── GET PATIENT PROFILE ──────────────────────────────────────────────────────
// GET /api/patient/profile
// Protected - patient only
const getProfile = async (req, res, next) => {
  try {
    const user = req.user;

    // Get patient profile using userId
    const profile = await PatientProfile.findOne({ userId: user.userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        // Basic user info
        userId: user.userId,
        patientId: user.roleId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        // Patient-specific info
        ...profile.toObject(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── UPDATE PATIENT PROFILE ───────────────────────────────────────────────────
// PUT /api/patient/profile
// Protected - patient only
const updateProfile = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      emergencyContact,
      allergies,
      chronicConditions,
    } = req.body;

    // Update basic user info
    const updatedUser = await User.findOneAndUpdate(
      { userId: req.user.userId },
      { name, phone },
      { new: true, runValidators: true }
    );

    // Update patient profile
    const updatedProfile = await PatientProfile.findOneAndUpdate(
      { userId: req.user.userId },
      {
        dateOfBirth,
        gender,
        bloodGroup,
        address,
        emergencyContact,
        allergies: Array.isArray(allergies) ? allergies : [],
        chronicConditions: Array.isArray(chronicConditions) ? chronicConditions : [],
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: {
        userId: updatedUser.userId,
        patientId: updatedUser.roleId,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        profileImage: updatedUser.profileImage,
        ...updatedProfile.toObject(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── UPLOAD PROFILE IMAGE ─────────────────────────────────────────────────────
// POST /api/patient/profile/image
// Protected - patient only
// Requires multer middleware for single file upload
const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided.",
      });
    }

    // If user already has a profile image, delete old one from Cloudinary
    if (req.user.profileImage && req.user.profileImage.publicId) {
      await cloudinary.uploader.destroy(req.user.profileImage.publicId);
    }

    // req.file.path and req.file.filename are set by multer-storage-cloudinary
    const updatedUser = await User.findOneAndUpdate(
      { userId: req.user.userId },
      {
        profileImage: {
          url: req.file.path,
          publicId: req.file.filename,
        },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile image updated successfully.",
      profileImage: updatedUser.profileImage,
    });
  } catch (error) {
    next(error);
  }
};

// ─── UPLOAD MEDICAL REPORT ─────────────────────────────────────────────────────
// POST /api/patient/reports
// Protected - patient only
// Requires multer middleware for single file upload
const uploadMedicalReport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No report file provided.",
      });
    }

    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Report title is required.",
      });
    }

    // Determine file type
    let fileType = "other";
    if (req.file.mimetype === "application/pdf") fileType = "pdf";
    else if (req.file.mimetype.startsWith("image/")) fileType = "image";

    // Create report entry
    const reportEntry = {
      reportId: uuidv4(), // Unique ID for this report
      title,
      description,
      fileUrl: req.file.path,
      publicId: req.file.filename,
      fileType,
      uploadedAt: new Date(),
    };

    // Push to patient's reports array
    const updatedProfile = await PatientProfile.findOneAndUpdate(
      { userId: req.user.userId },
      { $push: { medicalReports: reportEntry } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: "Medical report uploaded successfully.",
      report: reportEntry,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET ALL MEDICAL REPORTS ──────────────────────────────────────────────────
// GET /api/patient/reports
// Protected - patient only
const getMedicalReports = async (req, res, next) => {
  try {
    const profile = await PatientProfile.findOne(
      { userId: req.user.userId },
      { medicalReports: 1 } // Only return reports field
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found.",
      });
    }

    res.status(200).json({
      success: true,
      count: profile.medicalReports.length,
      data: profile.medicalReports,
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE MEDICAL REPORT ────────────────────────────────────────────────────
// DELETE /api/patient/reports/:reportId
// Protected - patient only
const deleteMedicalReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;

    const profile = await PatientProfile.findOne({ userId: req.user.userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found.",
      });
    }

    // Find the report
    const report = profile.medicalReports.find((r) => r.reportId === reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    // Delete from Cloudinary
    if (report.publicId) {
      await cloudinary.uploader.destroy(report.publicId, {
        resource_type: report.fileType === "pdf" ? "raw" : "image",
      });
    }

    // Remove from database
    await PatientProfile.findOneAndUpdate(
      { userId: req.user.userId },
      { $pull: { medicalReports: { reportId } } }
    );

    res.status(200).json({
      success: true,
      message: "Medical report deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET PRESCRIPTIONS ────────────────────────────────────────────────────────
// GET /api/patient/prescriptions
// Protected - patient only
const getPrescriptions = async (req, res, next) => {
  try {
    const profile = await PatientProfile.findOne(
      { userId: req.user.userId },
      { prescriptions: 1 }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found.",
      });
    }

    res.status(200).json({
      success: true,
      count: profile.prescriptions.length,
      data: profile.prescriptions,
    });
  } catch (error) {
    next(error);
  }
};

// ─── ADD PRESCRIPTION (Internal use by Doctor Service via internal API) ────────
// POST /api/patient/prescriptions/add
// This endpoint is called by MS2 (Doctor Service) internally
// Protected with a service-to-service internal key
const addPrescription = async (req, res, next) => {
  try {
    // Verify internal service key
    const internalKey = req.headers["x-internal-service-key"];
    if (internalKey !== process.env.INTERNAL_SERVICE_KEY) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized internal service call.",
      });
    }

    const {
      patientId,
      prescriptionId,
      doctorId,
      doctorName,
      appointmentId,
      medications,
      diagnosis,
      notes,
    } = req.body;

    if (!patientId || !medications) {
      return res.status(400).json({
        success: false,
        message: "patientId and medications are required.",
      });
    }

    // Find patient profile by roleId (PAT-0001)
    const profile = await PatientProfile.findOneAndUpdate(
      { patientId },
      {
        $push: {
          prescriptions: {
            prescriptionId: prescriptionId || uuidv4(),
            doctorId,
            doctorName,
            appointmentId,
            medications,
            diagnosis,
            notes,
            issuedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    res.status(201).json({
      success: true,
      message: "Prescription added successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET PATIENT BY PATIENTID (Internal - for Doctor Service) ──────────────────
// GET /api/patient/internal/:patientId
// Protected with internal service key
const getPatientByPatientId = async (req, res, next) => {
  try {
    const internalKey = req.headers["x-internal-service-key"];
    if (internalKey !== process.env.INTERNAL_SERVICE_KEY) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized internal service call.",
      });
    }

    const { patientId } = req.params;

    const profile = await PatientProfile.findOne({ patientId });
    const user = profile
      ? await User.findOne({ userId: profile.userId })
      : null;

    if (!profile || !user) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        userId: user.userId,
        patientId: user.roleId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: profile.gender,
        bloodGroup: profile.bloodGroup,
        allergies: profile.allergies,
        chronicConditions: profile.chronicConditions,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfileImage,
  uploadMedicalReport,
  getMedicalReports,
  deleteMedicalReport,
  getPrescriptions,
  addPrescription,
  getPatientByPatientId,
};