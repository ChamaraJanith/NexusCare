// Main Express app - MS1: User & Patient Service
// Handles: Auth (JWT), Patient Management, Doctor Registration, Admin User Management
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Import routes
const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Connect to MongoDB
connectDB();

const app = express();

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet()); // Sets secure HTTP headers

// CORS - allow requests from frontend and other microservices
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-internal-service-key",
    ],
  })
);

// ─── General Middleware ──────────────────────────────────────────────────────
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// HTTP request logger (only in development)
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ─── Health Check Route ──────────────────────────────────────────────────────
// Used by Kubernetes liveness/readiness probes
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "MS1 - User & Patient Service",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);        // Auth: register, login, verify-token
app.use("/api/patient", patientRoutes);  // Patient: profile, reports, prescriptions
app.use("/api/admin", adminRoutes);      // Admin: user management, doctor verification

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 MS1 User & Patient Service running on port ${PORT}`);
  console.log(`📌 Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;