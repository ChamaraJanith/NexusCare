// Auth controller - handles user registration and login
// Covers all 3 roles: patient, doctor, admin
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const PatientProfile = require("../models/PatientProfile");
const DoctorProfile = require("../models/DoctorProfile");
const cloudinary = require("../config/cloudinary");

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5006/api/notifications/register";

// Helper: Generate JWT token from userId and role
const generateToken = (userId, role, roleId) => {
  return jwt.sign(
    { userId, role, roleId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// helper for cross-service registration notification
const sendRegistrationNotification = async ({ email, name, role }) => {
  if (!email || !name || !role) return;

  try {
    const resp = await fetch(NOTIFICATION_SERVICE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, role }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.warn(`Notification service non-2xx response: ${resp.status} ${text}`);
      return;
    }

    console.log(`✅ Registration notification posted for ${email}`);
  } catch (err) {
    console.warn("⚠️ Failed to post registration notification", err.message || err);
  }
};

const NOTIFICATION_SERVICE_SMS_URL = process.env.NOTIFICATION_SERVICE_SMS_URL || "http://localhost:5006/api/notifications/send-sms";

const sendRegistrationSMS = async ({ phoneNumber, name, role }) => {
  if (!phoneNumber || !name || !role) return;

  // Optional: Sri Lanka-only (uncomment if needed)
  // if (!/^\+94\d{9}$/.test(phoneNumber)) return;

  const displayRole = role === "doctor" ? "Doctor" : "Patient";
  const message = `Hello ${name}, your ${displayRole.toLowerCase()} account has been created successfully on NexusCare.`;

  try {
    const resp = await fetch(NOTIFICATION_SERVICE_SMS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber, message }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.warn(`SMS service non-2xx response: ${resp.status} ${text}`);
      return;
    }

    console.log(`✅ Registration SMS queued for ${phoneNumber}`);
  } catch (err) {
    console.warn("⚠️ Failed to post registration SMS", err.message || err);
  }
};

// ─── REGISTER ───────────────────────────────────────────────────────────────
// POST /api/auth/register
// Body: { name, email, password, phone, role, ...role-specific fields }
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and role are required.",
      });
    }

    // Validate role
    if (!["patient", "doctor", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be patient, doctor, or admin.",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered.",
      });
    }

    // Create user (userId and roleId are auto-generated in pre-save hook)
    const user = await User.create({ name, email, password, phone, role });

    // Create role-specific profile
    if (role === "patient") {
      // Create a basic patient profile linked to this user
      await PatientProfile.create({
        userId: user.userId,
        patientId: user.roleId,
      });
    } else if (role === "doctor") {
      // Doctor registration requires extra fields
      const {
        registrationNumber,
        specialty,
        subSpecialty,
        experience,
        qualifications,
        hospital,
        bio,
        consultationFee,
      } = req.body;

      if (!registrationNumber || !specialty) {
        // Rollback: delete the user that was created
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({
          success: false,
          message: "Registration number and specialty are required for doctors.",
        });
      }

      await DoctorProfile.create({
        userId: user.userId,
        doctorId: user.roleId,
        registrationNumber,
        specialty,
        subSpecialty,
        experience,
        qualifications: qualifications
          ? qualifications.split(",").map((q) => q.trim())
          : [],
        hospital,
        bio,
        consultationFee,
      });
    }

    // Notify notification-service (non-blocking)
    sendRegistrationNotification({ email: user.email, name: user.name, role: user.role });
    sendRegistrationSMS({ phoneNumber: phone, name: user.name, role: user.role });

    // Generate token
    const token = generateToken(user.userId, user.role, user.roleId);

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user: {
        userId: user.userId,
        roleId: user.roleId,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password }
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Find user and include password field (excluded by default)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Contact admin.",
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Generate token - includes userId, role, and roleId for other services
    const token = generateToken(user.userId, user.role, user.roleId);

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        userId: user.userId,
        roleId: user.roleId,  // PAT-0001 or DOC-0001 or null for admin
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────
// GET /api/auth/me
// Protected - requires valid JWT
const getMe = async (req, res, next) => {
  try {
    // req.user is already attached by auth middleware (protect)
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

// ─── VERIFY TOKEN (for other microservices) ───────────────────────────────────
// POST /api/auth/verify-token
// Used by MS2, MS3, MS4 to verify tokens internally
// Returns: { userId, role, roleId (doctorId or patientId) }
const verifyToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user to get full info
    const user = await User.findOne({ userId: decoded.userId });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid token or user not found.",
      });
    }

    let specialty = null;
    let hospital = null;
    if (user.role === "doctor") {
      const doctorProfile = await DoctorProfile.findOne({ doctorId: user.roleId });
      if (doctorProfile) {
        specialty = doctorProfile.specialty;
        hospital = doctorProfile.hospital;
      }
    }

    // Return the user identity for the requesting microservice
    res.status(200).json({
      success: true,
      userId: user.userId,
      roleId: user.roleId,   // DOC-0001 or PAT-0001
      role: user.role,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      profileImage: user.profileImage,
      specialty: specialty,
      hospital: hospital,
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }
    next(error);
  }
};

// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────
// PATCH /api/auth/change-password
// Protected
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters.",
      });
    }

    // Get user with password
    const user = await User.findOne({ userId: req.user.userId }).select("+password");

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// ─── SEARCH DOCTORS BY NAME (Used by MS2) ──────────────────────────────────
// POST /api/auth/doctors/search
// Body: { name: string }
// Returns: Array of { doctorId, name, profileImage }
const searchDoctorsByName = async (req, res, next) => {
  try {
    const { name } = req.body;

    const query = { role: "doctor", isActive: true };
    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    const doctors = await User.find(query).select("roleId name profileImage");

    res.status(200).json({
      success: true,
      data: doctors.map(d => ({
        doctorId: d.roleId,
        name: d.name,
        profileImage: d.profileImage
      }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  verifyToken,
  changePassword,
  searchDoctorsByName,
};