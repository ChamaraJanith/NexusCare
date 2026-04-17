import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import doctorSearchRoutes from "./routes/doctorSearchRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import { initializeConsumer, closeConsumer } from "./utils/eventConsumer.js";
import { runStartupBackfill } from "./utils/startupBackfill.js";
import AvailabilitySlot from "./models/AvailabilitySlot.js";
import http from "node:http";
import { Server } from "socket.io";

const app = express();

// CORS for HTTP requests from frontend
app.use(
  cors({
    origin: "http://localhost:9000",
    credentials: true,
  }),
);

app.use(express.json());

// 🔥 create HTTP server
const server = http.createServer(app);

// 🔥 socket.io setup
const io = new Server(server, {
  cors: {
    origin: "*",
  },
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
app.use("/api/doctors", doctorSearchRoutes);
app.use("/api/availability", availabilityRoutes);

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
  };

  const shouldUseTls =
    MONGO_URI.startsWith("mongodb+srv://") || process.env.MONGO_TLS === "true";
  if (shouldUseTls) {
    mongoOptions.tls = true;
    mongoOptions.tlsAllowInvalidCertificates =
      process.env.NODE_ENV !== "production";
  }

  try {
    await mongoose.connect(MONGO_URI, mongoOptions);
    console.log("✅ MongoDB Connected");

    // One-time migration: normalize AvailabilitySlot.date from Date → YYYY-MM-DD string
    try {
      const slotsWithDateObj = await AvailabilitySlot.find({
        date: { $type: "date" },
      }).lean();

      if (slotsWithDateObj.length > 0) {
        console.log(`🔄 Migrating ${slotsWithDateObj.length} slots: Date → String`);
        const bulkOps = slotsWithDateObj.map((s) => ({
          updateOne: {
            filter: { _id: s._id },
            update: { $set: { date: new Date(s.date).toISOString().split("T")[0] } },
          },
        }));
        await AvailabilitySlot.bulkWrite(bulkOps);
        console.log("✅ AvailabilitySlot date migration complete");
      }
    } catch (migErr) {
      console.warn("⚠️ Date migration failed (non-critical):", migErr.message);
    }

    // Start Event Consumer for doctor slot updates
    try {
      await initializeConsumer();
    } catch (consumerError) {
      console.warn("⚠️ Event consumer failed to start:", consumerError.message);
    }

    // Re-publish all appointments on startup so downstream snapshots stay in sync
    runStartupBackfill().catch((err) =>
      console.warn("⚠️ Startup backfill failed (non-critical):", err.message)
    );
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
