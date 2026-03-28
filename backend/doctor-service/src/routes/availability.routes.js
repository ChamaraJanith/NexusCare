import express from "express";
import {
  createSlot,
  getSlots,
  updateSlot,
  deleteSlot,
  getSlotsByDoctorAndDate, // 🔥 ADD THIS
  bookSlot // 🔥 ALSO ADD THIS (if you added booking API)
} from "../controllers/availabilityController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// CREATE slot (doctor only)
router.post("/", verifyToken, allowRoles("doctor"), createSlot);

// GET slots by doctor (any authenticated user — patients/admins can view)
router.get("/:doctorId", verifyToken, getSlots);

// 🔥 NEW ROUTE → book slot
router.put("/book", bookSlot);

// UPDATE slot by _id (doctor only)
router.put("/:slotId", verifyToken, allowRoles("doctor"), updateSlot);

// DELETE slot by _id — soft delete (doctor only)
router.delete("/:slotId", verifyToken, allowRoles("doctor"), deleteSlot);

// 🔥 NEW ROUTE → get slots by date
// 🔥 PUBLIC route (patients also can view slots)
router.get("/:doctorId/by-date", getSlotsByDoctorAndDate);

// 🔥 NEW ROUTE → book slot
router.put("/book", bookSlot);

export default router;