import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import appointmentRoutes from "./routes/appointmentRoutes.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:9000",
  credentials: true
}));

// 🔹 Body parser (important)
app.use(express.json());

// 🔹 Routes
app.use("/api/appointments", appointmentRoutes);

// 🔹 Health check
app.get("/", (req, res) => {
  res.send("Appointment Service is running 🚀");
});

// 🔹 Environment
const PORT = process.env.PORT || 5003;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env");
  process.exit(1);
}

// 🔹 DB + Server
const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`🚀 Appointment Service running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

startServer();