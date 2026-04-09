// DoctorProfile model - stores doctor-specific registration data
// Doctor registers here (MS1 handles registration), MS2 handles management
// Linked to User model via userId (DOC-0001)
const mongoose = require("mongoose");

const doctorProfileSchema = new mongoose.Schema(
  {
    // Reference to the user's userId field
    userId: {
      type: String,
      required: true,
      unique: true,
      ref: "User",
    },

    // Doctor's role-specific ID (DOC-0001)
    doctorId: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // Medical registration number (SLMC number in Sri Lanka)
    registrationNumber: {
      type: String,
      required: [true, "Medical registration number is required"],
      unique: true,
      trim: true,
    },

    // Medical specialty (e.g., Cardiologist, Dermatologist)
    specialty: {
      type: String,
      required: [true, "Specialty is required"],
      trim: true,
    },

    // Sub-specialty if any
    subSpecialty: {
      type: String,
      trim: true,
    },

    // Years of experience
    experience: {
      type: Number,
      min: 0,
    },

    // Qualifications list (e.g., MBBS, MD)
    qualifications: [
      {
        type: String,
        trim: true,
      },
    ],

    // Current hospital or clinic name
    hospital: {
      type: String,
      trim: true,
    },

    // Short bio shown to patients
    bio: {
      type: String,
      maxlength: 500,
    },

    // Consultation fee in LKR
    consultationFee: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Verification status - admin must verify before doctor is active
    // false = pending, true = verified
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Admin who verified and when
    verifiedBy: {
      type: String, // admin userId
    },

    verifiedAt: {
      type: Date,
    },

    // Reason if rejected by admin
    rejectionReason: {
      type: String,
    },

    // Documents submitted for verification (license, degree, etc.)
    verificationDocuments: [
      {
        title: String,
        fileUrl: String,
        publicId: String, // Cloudinary
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("DoctorProfile", doctorProfileSchema);