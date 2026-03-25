import express from "express";
import { addPrescription, getPrescriptions, updatePrescription, deletePrescription } from "../controllers/prescriptionController.js";

const router = express.Router();

router.post("/", addPrescription);
router.get("/:patientId", getPrescriptions);

// limited update
router.put("/:id", updatePrescription);

// soft delete
router.delete("/:id", deletePrescription);

export default router;