const express = require("express");
const router = express.Router();
const {
  setDoctorFee,
  getDoctorFee,
  getAllDoctorFees,
  deleteDoctorFee,
} = require("../controllers/doctorFeeController");
const { protect, adminOnly, internalOrAdmin } = require("../middleware/auth");

// Internal or admin read
router.get("/", protect, adminOnly, getAllDoctorFees);
router.get("/:doctorId", internalOrAdmin, getDoctorFee);

// Admin only write
router.post("/", protect, adminOnly, setDoctorFee);
router.delete("/:doctorId", protect, adminOnly, deleteDoctorFee);

module.exports = router;