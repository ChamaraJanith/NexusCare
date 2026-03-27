import express from "express";
import {
  createSlot,
  getSlots,
  updateSlot,
  deleteSlot
} from "../controllers/availabilityController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// CREATE slot (doctor only)
router.post("/", verifyToken, allowRoles("doctor"), createSlot);

// GET slots by doctor (any authenticated user — patients/admins can view)
router.get("/:doctorId", verifyToken, getSlots);

// UPDATE slot by _id (doctor only)
router.put("/:slotId", verifyToken, allowRoles("doctor"), updateSlot);

// DELETE slot by _id — soft delete (doctor only)
router.delete("/:slotId", verifyToken, allowRoles("doctor"), deleteSlot);

export default router;