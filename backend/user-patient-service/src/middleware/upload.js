// Upload middleware - handles file uploads using multer + cloudinary
// Supports profile images and medical report PDFs/images
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Storage config for profile images
const profileImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "nexuscare/profile-images", // Cloudinary folder
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 500, height: 500, crop: "fill" }], // Resize to square
  },
});

// Storage config for medical reports (PDFs and images)
const medicalReportStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "nexuscare/medical-reports",
    allowed_formats: ["pdf", "jpg", "jpeg", "png"],
    resource_type: "auto", // Auto-detect file type (image or raw for PDF)
  },
});

// Storage config for doctor verification documents
const verificationDocStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "nexuscare/verification-docs",
    allowed_formats: ["pdf", "jpg", "jpeg", "png"],
    resource_type: "auto",
  },
});

// File filter - only allow specific types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed."), false);
  }
};

// Multer instances
const uploadProfileImage = multer({
  storage: profileImageStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const uploadMedicalReport = multer({
  storage: medicalReportStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const uploadVerificationDoc = multer({
  storage: verificationDocStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = {
  uploadProfileImage,
  uploadMedicalReport,
  uploadVerificationDoc,
};