import express from "express";
import {
  createDoctor,
  getDoctor,
  updateDoctor,
  deleteDoctor,
  searchDoctors
} from "../controllers/doctorController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { doctorSchema } from "../validators/doctorValidator.js";

const router = express.Router();

// 🔍 SEARCH + FILTER Doctors (public or protected based on requirement)
router.get("/", searchDoctors);

// 🔐 Create doctor profile (only doctor role)
router.post(
  "/",
  verifyToken,
  allowRoles("doctor"),
  validate(doctorSchema),
  createDoctor
);

// 🔍 Get doctor profile (any logged user)
router.get("/:id", verifyToken, getDoctor);

// 🔄 Update doctor profile (only owner doctor)
router.put(
  "/:id",
  verifyToken,
  allowRoles("doctor"),
  validate(doctorSchema),
  updateDoctor
);

// ❌ Soft delete doctor profile (only owner doctor)
router.delete(
  "/:id",
  verifyToken,
  allowRoles("doctor"),
  deleteDoctor
);

export default router;