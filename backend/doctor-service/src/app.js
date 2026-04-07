import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import doctorRoutes from "./routes/doctor.routes.js";
import availabilityRoutes from "./routes/availability.routes.js";
import prescriptionRoutes from "./routes/prescription.routes.js"; // 🔥 ADD THIS

dotenv.config();

const app = express();

// 🔹 Middleware
app.use(cors());
app.use(express.json());

// 🔹 Serve uploaded profile images as static files
app.use("/uploads", express.static("uploads"));

// 🔹 Routes
app.use("/api/doctors", doctorRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/prescriptions", prescriptionRoutes); // 🔥 ADD THIS

// 🔹 Global Error Handler for upload/multer errors
app.use((err, req, res, next) => {
  console.error("❌ Global Error Handler:", err);
  console.error("❌ Error name:", err.name);
  console.error("❌ Error code:", err.code);
  console.error("❌ Error field:", err.field);
  console.error("❌ Error stack:", err.stack);

  // Multer-specific errors (wrong field name, file too large, etc.)
  if (err.name === "MulterError") {
    const statusMap = {
      LIMIT_FILE_SIZE: 413,
      LIMIT_UNEXPECTED_FILE: 400,
    };
    const status = statusMap[err.code] || 400;
    return res.status(status).json({
      success: false,
      message: `Upload error: ${err.message} (code: ${err.code}, field: ${err.field || "unknown"})`,
    });
  }

  // Multer file-filter rejection (custom error thrown in fileFilter)
  if (err.message?.includes("Only image files")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// 🔹 Health Check
app.get("/", (req, res) => {
  res.send("Doctor Service is running 🚀");
});

// 🔹 Env Variables
const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI;

console.log("MONGO_URI:", MONGO_URI);

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env");
  process.exit(1);
}

const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("✅ MongoDB Connected");

    try {
      const syncResult = await import("./services/videoCatalogSyncService.js");
      const result = await syncResult.syncFullDoctorCatalog();
      console.log("✅ Full doctor catalog sync triggered at startup:", result);
    } catch (syncError) {
      console.warn("⚠️ Full doctor catalog sync failed at startup:", syncError.message);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Doctor Service running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

startServer();