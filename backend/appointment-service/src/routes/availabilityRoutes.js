import express from "express";
import * as doctorService from "../services/doctorService.js";

const router = express.Router();

router.get("/:doctorId/by-date", async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ error: "doctorId and date are required" });
    }

    const result = await doctorService.getDoctorSlots(doctorId, date);

    // Check if result is in new format { data, stale, message }
    if (result.stale !== undefined) {
      // New format
      if (result.stale) {
        res.set("X-Cache", "STALE");
        res.set("X-Cache-Message", encodeURIComponent(result.message));
      } else {
        res.set("X-Cache", "FRESH");
      }
      return res.json(result);
    }

    // Legacy format (direct data) - shouldn't happen but handle gracefully
    res.set("X-Cache", "FRESH");
    res.json({ data: result, stale: false, message: "" });
  } catch (error) {
    console.error("❌ Availability fetch error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get("/:doctorId/next", async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!doctorId) {
      return res.status(400).json({ error: "doctorId is required" });
    }

    const result = await doctorService.getDoctorSlotsNextDays(doctorId);

    // Check if result is in new format { data, stale, message }
    if (result.stale !== undefined) {
      // New format
      if (result.stale) {
        res.set("X-Cache", "STALE");
        res.set("X-Cache-Message", encodeURIComponent(result.message));
      } else {
        res.set("X-Cache", "FRESH");
      }
      return res.json(result);
    }

    // Legacy format (direct data)
    res.set("X-Cache", "FRESH");
    res.json({ data: result, stale: false, message: "" });
  } catch (error) {
    console.error("❌ Upcoming availability fetch error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get("/:doctorId", async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!doctorId) {
      return res.status(400).json({ error: "doctorId is required" });
    }

    const result = await doctorService.getDoctorSlotsNextDays(doctorId);

    // Check if result is in new format { data, stale, message }
    if (result.stale !== undefined) {
      // New format
      if (result.stale) {
        res.set("X-Cache", "STALE");
        res.set("X-Cache-Message", encodeURIComponent(result.message));
      } else {
        res.set("X-Cache", "FRESH");
      }
      return res.json(result);
    }

    // Legacy format (direct data)
    res.set("X-Cache", "FRESH");
    res.json({ data: result, stale: false, message: "" });
  } catch (error) {
    console.error("❌ Availability fetch error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get("/", (req, res) => {
  res.status(400).json({
    error: "doctorId is required",
    message:
      "Use /api/availability/:doctorId or /api/availability/:doctorId/by-date",
  });
});

export default router;
