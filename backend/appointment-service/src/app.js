import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import http from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
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
  await mongoose.connect(MONGO_URI);
  console.log("✅ MongoDB Connected");

  server.listen(PORT, () => {
    console.log(`🚀 Server running on ${PORT}`);
  });
};

startServer();