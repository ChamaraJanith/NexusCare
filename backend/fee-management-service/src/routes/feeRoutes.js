const express = require("express");
const router = express.Router();
const { getServiceFee, updateServiceFee, calculateFee } = require("../controllers/feeController");
const { protect, adminOnly, internalOrAdmin } = require("../middleware/auth");

router.get("/", getServiceFee);
router.put("/", protect, adminOnly, updateServiceFee);
router.post("/calculate", internalOrAdmin, calculateFee);
router.post("/calculate/public", calculateFee); // public — for frontend fee display

module.exports = router;