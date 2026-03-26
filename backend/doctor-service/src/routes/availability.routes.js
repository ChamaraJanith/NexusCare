import express from "express";
import {
  createSlot,
  getSlots,
  updateSlot,
  deleteSlot
} from "../controllers/availabilityController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { slotSchema } from "../validators/availabilityValidator.js";

const router = express.Router();

// ✅ CREATE SLOT
router.post(
  "/",
  verifyToken,
  allowRoles("doctor"),
  validate(slotSchema),
  createSlot
);

// ✅ GET SLOTS BY DOCTOR
router.get("/:doctorId", verifyToken, getSlots);

// 🔥 UPDATE SLOT
router.put(
  "/",
  verifyToken,
  allowRoles("doctor"),
  validate(slotSchema), // 🔥 ADD THIS
  updateSlot
);

// 🔥 DELETE SLOT
router.delete(
  "/",
  verifyToken,
  allowRoles("doctor"),
  deleteSlot
);

export default router;