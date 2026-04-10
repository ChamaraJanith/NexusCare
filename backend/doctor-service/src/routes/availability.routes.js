import express from "express";
import {
  createSlot,
  getSlots,
  getSlotsNextDays,
  updateSlot,
  deleteSlot,
  getSlotsByDoctorAndDate,
  bookSlot,
  releaseSlot
} from "../controllers/availabilityController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// 🔥 BOOK SLOT — must be BEFORE /:slotId
router.put("/book", bookSlot);

// 🔓 RELEASE SLOT (on cancellation)
router.put("/release", releaseSlot);

// CREATE slot
router.post("/", verifyToken, allowRoles("doctor"), createSlot);

// GET slots by doctor (public)
router.get("/:doctorId", getSlots);

// GET upcoming slots for the next N days (public)
router.get("/:doctorId/next", getSlotsNextDays);

// GET slots by date (public)
router.get("/:doctorId/by-date", getSlotsByDoctorAndDate);

// UPDATE slot — after /book to avoid conflict
router.put("/:slotId", verifyToken, allowRoles("doctor"), updateSlot);

// DELETE slot
router.delete("/:slotId", verifyToken, allowRoles("doctor"), deleteSlot);

export default router;