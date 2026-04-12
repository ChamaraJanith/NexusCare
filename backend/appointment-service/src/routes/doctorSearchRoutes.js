import express from "express";
import * as doctorService from "../services/doctorService.js";

const router = express.Router();

// GET /api/doctors/search
// Proxied here by the gateway — has cache fallback when doctor-service is down
router.get("/search", async (req, res) => {
  try {
    const { name, specialization, hospital, location, date } = req.query;

    const result = await doctorService.searchDoctors({
      name,
      specialization,
      hospital,
      location,
      date,
    });

    if (result.stale) {
      res.set("X-Cache", "STALE");
    }

    res.json(result);
  } catch (error) {
    console.error("❌ Doctor search error:", error.message);
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message });
  }
});

router.get("/internal/:doctorId", async (req, res) => {
  try {
    const { doctorId } = req.params;
    const result = await doctorService.getDoctorById(doctorId);

    if (!result.data) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    if (result.stale) {
      res.set("X-Cache", "STALE");
    }

    res.json(result);
  } catch (error) {
    console.error("❌ Doctor details error:", error.message);
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message });
  }
});

export default router;
