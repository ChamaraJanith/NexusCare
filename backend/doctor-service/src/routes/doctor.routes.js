import express from "express";
import {
  getDoctor,
  updateDoctor,
  searchDoctors
} from "../controllers/doctorController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { updateDoctorSchema } from "../validators/doctorValidator.js";

const router = express.Router();

// 🔍 SEARCH + FILTER Doctors (public or protected based on requirement)
router.get("/", searchDoctors);

// 🔍 Get doctor profile (any logged user)
router.get("/:id", verifyToken, getDoctor);

// 🔄 Update doctor profile (only owner doctor)
router.put(
  "/:id",
  verifyToken,
  allowRoles("doctor"),
  validate(updateDoctorSchema),
  updateDoctor
);

export default router;