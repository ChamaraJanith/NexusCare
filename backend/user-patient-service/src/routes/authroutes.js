// Auth routes - /api/auth
const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  verifyToken,
  changePassword,
  searchDoctorsByName,
  getDoctorFee,
  updateDoctorFee,
} = require("../controllers/authcontroller");
const { protect, restrictTo } = require("../middleware/auth");
const { uploadVerificationDoc } = require("../middleware/upload");

router.post(
  "/register",
  uploadVerificationDoc.array("documents", 5),
  register
);

// Public routes (no token needed)
router.post("/register", register);       // Register patient, doctor, or admin
router.post("/login", login);             // Login for all roles
router.post("/verify-token", verifyToken); // Used by other microservices
router.post("/doctors/search", searchDoctorsByName); // Used by MS2 for name resolution

// Protected routes (token required)
router.get("/me", protect, getMe);                          // Get current user info
router.patch("/change-password", protect, changePassword);  // Change password

// Internal: MS6 fetches doctor fee
router.get("/doctors/fee/:doctorId", getDoctorFee);

// Admin: update a doctor's consultation fee
router.patch("/doctors/:doctorId/fee", protect, restrictTo("admin"), updateDoctorFee);

module.exports = router;