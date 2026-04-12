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

    const data = await doctorService.getDoctorSlots(doctorId, date);
    res.json(data);
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

    const data = await doctorService.getDoctorSlotsNextDays(doctorId);
    res.json(data);
  } catch (error) {
    console.error("❌ Upcoming availability fetch error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
