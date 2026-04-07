import express from "express";
import {
  getDoctorMe,
  updateDoctorMe,
  uploadProfileImage,
  getDoctor,
  updateDoctor,
  searchDoctors,
  syncDoctorCatalog,
} from "../controllers/doctorController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { updateDoctorSchema } from "../validators/doctorValidator.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// 🛠️ TEMP TEST ROUTE
router.post("/test-image-upload",
  (req, res, next) => {
    req.user = { doctorId: "DOC-TEST" };
    next();
  },
  upload.single("image"),
  uploadProfileImage
);

// 🔍 SEARCH + FILTER Doctors (public or protected based on requirement)
router.get("/search", searchDoctors);
router.post("/sync/full", verifyToken, allowRoles("admin"), syncDoctorCatalog);

// 👤 GET aggregated doctor profile (identity + professional data)
// MUST be before /:id to prevent "me" being treated as an ID
router.get("/me", verifyToken, allowRoles("doctor"), getDoctorMe);

// ✏️ UPDATE own profile
router.put("/me", verifyToken, allowRoles("doctor"), updateDoctorMe);

// 📸 UPLOAD own profile image
router.post("/me/image", verifyToken, allowRoles("doctor"), upload.single("image"), uploadProfileImage);
//router.post("/me/image", upload.single("image"), uploadProfileImage);
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
