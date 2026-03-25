// Auth routes - /api/auth
const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  verifyToken,
  changePassword,
} = require("../controllers/authcontroller");
const { protect } = require("../middleware/auth");

// Public routes (no token needed)
router.post("/register", register);       // Register patient, doctor, or admin
router.post("/login", login);             // Login for all roles
router.post("/verify-token", verifyToken); // Used by other microservices

// Protected routes (token required)
router.get("/me", protect, getMe);                          // Get current user info
router.patch("/change-password", protect, changePassword);  // Change password

module.exports = router;