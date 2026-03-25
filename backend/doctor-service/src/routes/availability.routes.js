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

// Only doctors can manage availability
router.post("/", verifyToken, allowRoles("doctor"), validate(slotSchema), createSlot);
router.get("/:doctorId", verifyToken, getSlots);
router.put("/:id", verifyToken, allowRoles("doctor"), updateSlot);
router.delete("/:id", verifyToken, allowRoles("doctor"), deleteSlot);

export default router;