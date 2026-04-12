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

export default router;
