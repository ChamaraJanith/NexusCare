import express from "express";
import {
  createSlot,
  getSlots,
  updateSlot,
  deleteSlot
} from "../controllers/availabilityController.js";

const router = express.Router();

router.post("/", createSlot);
router.get("/:doctorId", getSlots);
router.put("/:id", updateSlot);     
router.delete("/:id", deleteSlot);  

export default router;