// Patient routes - /api/patient
const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  uploadProfileImage,
  uploadMedicalReport,
  getMedicalReports,
  deleteMedicalReport,
  getPrescriptions,
  addPrescription,
  getPatientByPatientId,
  getPatientForDoctor,
} = require("../controllers/patientcontroller");
const { protect, restrictTo } = require("../middleware/auth");
const {
  uploadProfileImage: multerProfileImage,
  uploadMedicalReport: multerMedicalReport,
} = require("../middleware/upload");

// Internal routes (called by other microservices, NOT protected by JWT)
// These use x-internal-service-key header instead
router.post("/prescriptions/add", addPrescription);
router.get("/internal/:patientId", getPatientByPatientId);

// All routes below require authentication
router.use(protect);

// Routes accessible by both patients and doctors
router.get("/reports", restrictTo("patient", "doctor"), getMedicalReports);

// Routes accessible by doctors only
router.get("/doctor/:patientId", restrictTo("doctor"), getPatientForDoctor);

// All routes below require patient role only
router.use(restrictTo("patient"));

// Profile routes
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.post(
  "/profile/image",
  multerProfileImage.single("image"), // Field name in form-data: "image"
  uploadProfileImage
);

// Medical reports routes (Create, Delete)
router.post(
  "/reports",
  multerMedicalReport.single("report"), // Field name in form-data: "report"
  uploadMedicalReport
);
router.delete("/reports/:reportId", deleteMedicalReport);

// Prescriptions routes (read-only for patient)
router.get("/prescriptions", getPrescriptions);

module.exports = router;