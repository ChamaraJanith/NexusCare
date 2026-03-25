import express from "express";
import {
  addPrescription,
  getPrescriptions,
  updatePrescription,
  deletePrescription
} from "../controllers/prescriptionController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { prescriptionSchema } from "../validators/prescriptionValidator.js";

const router = express.Router();

// Only doctors can create prescriptions
router.post("/", verifyToken, allowRoles("doctor"), validate(prescriptionSchema), addPrescription);

router.get("/:patientId", verifyToken, getPrescriptions);

router.put("/:id", verifyToken, allowRoles("doctor"), updatePrescription);

router.delete("/:id", verifyToken, allowRoles("doctor"), deletePrescription);

export default router;