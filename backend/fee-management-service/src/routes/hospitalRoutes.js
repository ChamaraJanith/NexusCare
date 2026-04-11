const express = require("express");
const router = express.Router();
const {
  createHospital, getAllHospitals, getHospital, updateHospital, deleteHospital,
} = require("../controllers/hospitalController");
const { protect, adminOnly } = require("../middleware/auth");
const Hospital = require("../models/Hospital");

// Internal/public endpoint — returns just the hospitalFee for a given hospital
// Used by doctor-service to denormalize fee at slot creation time
router.get("/fee", async (req, res) => {
  try {
    const { hospitalId, hospitalName } = req.query;
    let doc = null;
    if (hospitalId) doc = await Hospital.findOne({ hospitalId, isActive: true });
    if (!doc && hospitalName) {
      doc = await Hospital.findOne({ name: { $regex: new RegExp(hospitalName.trim(), 'i') }, isActive: true });
    }
    res.json({ hospitalFee: doc?.hospitalFee ?? 0 });
  } catch (err) {
    res.json({ hospitalFee: 0 });
  }
});

router.get("/", getAllHospitals);
router.get("/:hospitalId", getHospital);
router.post("/", protect, adminOnly, createHospital);
router.put("/:hospitalId", protect, adminOnly, updateHospital);
router.delete("/:hospitalId", protect, adminOnly, deleteHospital);

module.exports = router;