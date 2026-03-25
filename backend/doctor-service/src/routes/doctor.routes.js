import express from "express";
import { createDoctor, getDoctor, updateDoctor, deleteDoctor } from "../controllers/doctorController.js";

const router = express.Router();

router.post("/", createDoctor);
router.get("/:id", getDoctor);
router.put("/:id", updateDoctor);
router.delete("/:id", deleteDoctor);

export default router;