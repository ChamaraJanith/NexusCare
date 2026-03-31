const express = require("express");
const router = express.Router();
const {
  createHospital, getAllHospitals, getHospital, updateHospital, deleteHospital,
} = require("../controllers/hospitalController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", getAllHospitals);
router.get("/:hospitalId", getHospital);
router.post("/", protect, adminOnly, createHospital);
router.put("/:hospitalId", protect, adminOnly, updateHospital);
router.delete("/:hospitalId", protect, adminOnly, deleteHospital);

module.exports = router;