// Admin controller - user management, doctor verification, platform oversight
const User = require("../models/User");
const PatientProfile = require("../models/PatientProfile");
const DoctorProfile = require("../models/DoctorProfile");

// ─── GET ALL USERS ────────────────────────────────────────────────────────────
// GET /api/admin/users
// Admin only - get all users with optional role filter and pagination
const getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 10, search } = req.query;

    // Build query filter
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { userId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET SINGLE USER ──────────────────────────────────────────────────────────
// GET /api/admin/users/:userId
// Admin only
const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Get role-specific profile
    let profile = null;
    if (user.role === "patient") {
      profile = await PatientProfile.findOne({ userId });
    } else if (user.role === "doctor") {
      profile = await DoctorProfile.findOne({ userId });
    }

    res.status(200).json({
      success: true,
      data: { user, profile },
    });
  } catch (error) {
    next(error);
  }
};

// ─── ACTIVATE / DEACTIVATE USER ───────────────────────────────────────────────
// PATCH /api/admin/users/:userId/status
// Admin only - toggle user active status
const toggleUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    const user = await User.findOneAndUpdate(
      { userId },
      { isActive },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: `User account ${isActive ? "activated" : "deactivated"} successfully.`,
      data: { userId: user.userId, isActive: user.isActive },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET PENDING DOCTOR VERIFICATIONS ─────────────────────────────────────────
// GET /api/admin/doctors/pending
// Admin only - list all doctors waiting for verification
const getPendingDoctors = async (req, res, next) => {
  try {
    const pendingDoctors = await DoctorProfile.find({ isVerified: false });

    // Get user info for each pending doctor
    const result = await Promise.all(
      pendingDoctors.map(async (profile) => {
        const user = await User.findOne({ userId: profile.userId });
        return {
          userId: profile.userId,
          doctorId: profile.doctorId,
          name: user ? user.name : "Unknown",
          email: user ? user.email : "Unknown",
          phone: user ? user.phone : null,
          specialty: profile.specialty,
          registrationNumber: profile.registrationNumber,
          hospital: profile.hospital,
          qualifications: profile.qualifications,
          verificationDocuments: profile.verificationDocuments,
          createdAt: profile.createdAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ─── VERIFY DOCTOR ────────────────────────────────────────────────────────────
// PATCH /api/admin/doctors/:doctorId/verify
// Admin only - approve or reject a doctor registration
const verifyDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { action, rejectionReason } = req.body;

    // action must be "approve" or "reject"
    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be 'approve' or 'reject'.",
      });
    }

    const profile = await DoctorProfile.findOne({ doctorId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    if (action === "approve") {
      // Verify doctor profile
      profile.isVerified = true;
      profile.verifiedBy = req.user.userId;
      profile.verifiedAt = new Date();
      profile.rejectionReason = undefined;
      await profile.save();

      // Also update the User's isVerified flag
      await User.findOneAndUpdate(
        { userId: profile.userId },
        { isVerified: true }
      );

      res.status(200).json({
        success: true,
        message: `Doctor ${doctorId} verified successfully.`,
      });
    } else {
      // Reject: set reason but don't delete the account
      profile.isVerified = false;
      profile.rejectionReason = rejectionReason || "No reason provided.";
      await profile.save();

      res.status(200).json({
        success: true,
        message: `Doctor ${doctorId} registration rejected.`,
      });
    }
  } catch (error) {
    next(error);
  }
};

// ─── GET PLATFORM STATISTICS ──────────────────────────────────────────────────
// GET /api/admin/stats
// Admin only - basic platform overview counts
const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalPatients,
      totalDoctors,
      totalAdmins,
      verifiedDoctors,
      pendingDoctors,
      activeUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "patient" }),
      User.countDocuments({ role: "doctor" }),
      User.countDocuments({ role: "admin" }),
      DoctorProfile.countDocuments({ isVerified: true }),
      DoctorProfile.countDocuments({ isVerified: false }),
      User.countDocuments({ isActive: true }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalPatients,
        totalDoctors,
        totalAdmins,
        verifiedDoctors,
        pendingDoctors,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE USER (Soft or Hard delete) ───────────────────────────────────────
// DELETE /api/admin/users/:userId
// Admin only - permanently delete a user (use with caution)
const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Prevent admin from deleting their own account
    if (userId === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own admin account.",
      });
    }

    // Delete role-specific profile
    if (user.role === "patient") {
      await PatientProfile.findOneAndDelete({ userId });
    } else if (user.role === "doctor") {
      await DoctorProfile.findOneAndDelete({ userId });
    }

    // Delete user
    await User.findOneAndDelete({ userId });

    res.status(200).json({
      success: true,
      message: `User ${userId} deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  toggleUserStatus,
  getPendingDoctors,
  verifyDoctor,
  getStats,
  deleteUser,
};