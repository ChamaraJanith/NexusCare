// Admin routes - /api/admin
const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  toggleUserStatus,
  getPendingDoctors,
  verifyDoctor,
  getStats,
  deleteUser,
  getAllDoctorFees,
} = require("../controllers/adminController");
const { protect, restrictTo } = require("../middleware/auth");

// All routes below require admin authentication
router.use(protect);
router.use(restrictTo("admin"));

// Platform statistics
router.get("/stats", getStats);

// User management
router.get("/users", getAllUsers);                               // Get all users (filterable by role)
router.get("/users/:userId", getUserById);                      // Get single user
router.patch("/users/:userId/status", toggleUserStatus);        // Activate/deactivate user
router.delete("/users/:userId", deleteUser);                    // Delete user

// Doctor verification
router.get("/doctors/pending", getPendingDoctors);              // List unverified doctors
router.patch("/doctors/:doctorId/verify", verifyDoctor);        // Approve or reject doctor

router.get("/doctors/fees", getAllDoctorFees);

module.exports = router;