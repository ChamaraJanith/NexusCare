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
} = require("../controllers/authcontroller");
const { protect } = require("../middleware/auth");

// Public routes (no token needed)
router.post("/register", register);       // Register patient, doctor, or admin
router.post("/login", login);             // Login for all roles
router.post("/verify-token", verifyToken); // Used by other microservices
router.post("/doctors/search", searchDoctorsByName); // Used by MS2 for name resolution

// Protected routes (token required)
router.get("/me", protect, getMe);                          // Get current user info
router.patch("/change-password", protect, changePassword);  // Change password

module.exports = router;