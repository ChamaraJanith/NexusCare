import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import http from "node:http";
import { Server } from "socket.io";

const app = express();

// CORS for HTTP requests from frontend
app.use(cors({
  origin: "http://localhost:9000",
  credentials: true,
}));

app.use(express.json());

// 🔥 create HTTP server
const server = http.createServer(app);

// 🔥 socket.io setup
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// 🔥 socket connection
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// 🔹 make io globally accessible
export { io };

app.use("/api/appointments", appointmentRoutes);

app.get("/", (req, res) => {
  res.send("Appointment Service running 🚀");
});

const PORT = process.env.PORT || 5003;
const MONGO_URI = process.env.MONGO_URI;

const startServer = async () => {
  if (!MONGO_URI) {
    console.error("❌ Missing MONGO_URI environment variable");
    process.exit(1);
  }

  const mongoOptions = {
    serverSelectionTimeoutMS: 15000,
    tls: true,
    tlsAllowInvalidCertificates: process.env.NODE_ENV !== 'production',
  };

  try {
    await mongoose.connect(MONGO_URI, mongoOptions);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.error(err);
    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log(`🚀 Server running on ${PORT}`);
  });
};

startServer();