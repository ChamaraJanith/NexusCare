import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import doctorRoutes from "./routes/doctor.routes.js";

dotenv.config();

const app = express();

// 🔹 Middleware
app.use(cors());
app.use(express.json());

// 🔹 Routes
app.use("/api/doctors", doctorRoutes);

// 🔹 Health Check
app.get("/", (req, res) => {
  res.send("Doctor Service is running 🚀");
});

// 🔹 Env Variables
const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI;

// 🔥 Debug (remove later)
console.log("MONGO_URI:", MONGO_URI);

// ❌ Stop app if no DB URI
if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env");
  process.exit(1);
}

// 🔹 MongoDB Connection + Server Start
const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // avoid hanging
    });

    console.log("✅ MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`🚀 Doctor Service running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

startServer();