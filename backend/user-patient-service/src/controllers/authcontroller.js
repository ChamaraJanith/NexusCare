// Auth controller - handles user registration and login
// Covers all 3 roles: patient, doctor, admin
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const PatientProfile = require("../models/PatientProfile");
const DoctorProfile = require("../models/DoctorProfile");
const cloudinary = require("../config/cloudinary");
const { publishRegistrationEvent, publishDoctorRegisteredEvent } = require("../services/rabbitmq");

// Helper: Generate JWT token from userId and role
const generateToken = (userId, role, roleId, name) => {
  return jwt.sign(
    { userId, role, roleId, name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

const getValidInternalServiceKeys = () => {
  return [process.env.INTERNAL_SERVICE_KEY, process.env.INTERNAL_SERVICE_KEY_FALLBACK].filter(Boolean);
};

// ─── REGISTER ───────────────────────────────────────────────────────────────
// POST /api/auth/register
// Body: { name, email, password, phone, role, ...role-specific fields }
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;
 
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and role are required.",
      });
    }
 
    if (!["patient", "doctor", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be patient, doctor, or admin.",
      });
    }
 
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered.",
      });
    }
 
    const user = await User.create({ name, email, password, phone, role });
 
    if (role === "patient") {
      await PatientProfile.create({
        userId: user.userId,
        patientId: user.roleId,
      });
    } else if (role === "doctor") {
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
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({
          success: false,
          message: "Registration number and specialty are required for doctors.",
        });
      }
 
      // ── Build verificationDocuments from uploaded files (if any) ─────────
      // req.files is set by multer uploadVerificationDoc.array("documents", 5)
      // Each file is already uploaded to Cloudinary by multer-storage-cloudinary.
      const verificationDocuments = (req.files || []).map((file) => ({
        title: file.originalname,
        fileUrl: file.path,        // Cloudinary secure URL
        publicId: file.filename,   // Cloudinary public ID (for future deletion)
        uploadedAt: new Date(),
      }));
 
      const doctorProfile = await DoctorProfile.create({
        userId: user.userId,
        doctorId: user.roleId,
        name: user.name,
        email: user.email,
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
        verificationDocuments,   // ← saved at creation time
      });

      publishDoctorRegisteredEvent({
        eventType: "doctor.registered",
        timestamp: new Date().toISOString(),
        userId: user.userId,
        doctorId: user.roleId,
        name: user.name,
        email: user.email,
        phone,
        specialty,
        subSpecialty,
        registrationNumber,
        hospital,
        bio,
        consultationFee,
        experience,
        qualifications: qualifications ? qualifications.split(",").map((q) => q.trim()) : [],
        verificationDocuments,
      }).catch((err) => {
        console.warn("⚠️ Failed to publish doctor.registered event", err.message || err);
      });
    }
 
    publishRegistrationEvent({
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      phone,
    }).catch((err) => {
      console.warn("⚠️ Failed to publish registration event", err.message || err);
    });
 
    const token = generateToken(user.userId, user.role, user.roleId, user.name);
 
    res.status(201).json({
      success: true,
      message:
        role === "doctor"
          ? "Registration successful. Awaiting admin verification."
          : "Registration successful.",
      token,
      // Tell the frontend how many docs were saved so it can show confirmation
      documentsUploaded: (req.files || []).length,
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

    // Block unverified doctors ────────────────────────────────────────────────
    if (user.role === "doctor") {
      const doctorProfile = await DoctorProfile.findOne({ doctorId: user.roleId });
 
      if (!doctorProfile) {
        return res.status(403).json({
          success: false,
          message: "Doctor profile not found. Please contact admin.",
        });
      }
 
      if (!doctorProfile.isVerified) {
        if (doctorProfile.rejectionReason) {
          return res.status(403).json({
            success: false,
            verified: false,
            rejected: true,
            message: `Your registration was rejected. Reason: ${doctorProfile.rejectionReason}`,
          });
        }
        return res.status(403).json({
          success: false,
          verified: false,
          rejected: false,
          message:
            "Your account is pending admin verification. You will be notified once approved.",
        });
      }
    }

    // Generate token - includes userId, role, roleId, and name for frontend use
    const token = generateToken(user.userId, user.role, user.roleId, user.name);

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

// ─── SEARCH DOCTORS BY NAME OR ID (Used by MS2) ────────────────────────────
// POST /api/auth/doctors/search
// Body: { name?: string, doctorId?: string }
// Returns: Array of { doctorId, name, profileImage }
const searchDoctorsByName = async (req, res, next) => {
  try {
    const { name, doctorId } = req.body;

    const query = { role: "doctor", isActive: true };
    if (doctorId) {
      query.roleId = doctorId;
    } else if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    const doctors = await User.find(query).select("roleId name profileImage email");

    res.status(200).json({
      success: true,
      data: doctors.map(d => ({
        doctorId: d.roleId,
        name: d.name,
        email: d.email,
        profileImage: d.profileImage
      }))
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET DOCTOR FEE (internal — called by MS6) ─────────────────────────────
// GET /api/auth/doctors/fee/:doctorId
const getDoctorFee = async (req, res, next) => {
  try {
    const internalKey = req.headers["x-internal-service-key"];
    const validKeys = getValidInternalServiceKeys();
    if (!validKeys.includes(internalKey)) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    const { doctorId } = req.params;
    const profile = await DoctorProfile.findOne({ doctorId });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Doctor not found." });
    }

    res.json({ success: true, consultationFee: profile.consultationFee || 0 });
  } catch (error) {
    next(error);
  }
};

// ─── UPDATE DOCTOR FEE (admin only) ─────────────────────────────────────────
// PATCH /api/auth/doctors/:doctorId/fee
const updateDoctorFee = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { consultationFee } = req.body;

    if (consultationFee === undefined || isNaN(Number(consultationFee))) {
      return res.status(400).json({ success: false, message: "consultationFee is required." });
    }

    const profile = await DoctorProfile.findOneAndUpdate(
      { doctorId },
      { consultationFee: Number(consultationFee) },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: "Doctor not found." });
    }

    res.json({
      success: true,
      message: "Doctor consultation fee updated.",
      data: { doctorId, consultationFee: profile.consultationFee },
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
  getDoctorFee,
  updateDoctorFee,
};