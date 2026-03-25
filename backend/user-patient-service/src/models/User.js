// User model - stores all users (patients, doctors, admins)
// Each user gets a userId (USER-0001), and role-specific ID (PAT-0001 or DOC-0001)
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Counter = require("./Counter");

const userSchema = new mongoose.Schema(
  {
    // Auto-generated sequential user ID: USER-0001, USER-0002, ...
    userId: {
      type: String,
      unique: true,
    },

    // Role-specific ID: PAT-0001 for patients, DOC-0001 for doctors, null for admins
    roleId: {
      type: String,
      unique: true,
      sparse: true, // allows multiple null values (for admins who don't need a roleId)
    },

    // Basic user info
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // Never return password in queries by default
    },

    // Role: patient | doctor | admin
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      required: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    // Profile picture (stored in Cloudinary)
    profileImage: {
      url: { type: String },
      publicId: { type: String }, // Cloudinary public ID for deletion
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // For doctors: admin must verify before they can accept appointments
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Pre-save hook: runs before every save()
userSchema.pre("save", async function () {
  // Only hash password if it was modified (new user or password change)
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }

  // Generate IDs only for new documents
  if (this.isNew) {
    // Generate USER-XXXX id
    const userSeq = await Counter.getNextSequence("user");
    this.userId = Counter.formatId("USER", userSeq);

    // Generate role-specific ID
    if (this.role === "patient") {
      const patSeq = await Counter.getNextSequence("patient");
      this.roleId = Counter.formatId("PAT", patSeq);
    } else if (this.role === "doctor") {
      const docSeq = await Counter.getNextSequence("doctor");
      this.roleId = Counter.formatId("DOC", docSeq);
    }
    // Admin has no roleId
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields when converting to JSON (for API responses)
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("User", userSchema);