// src/routes/symptomRoutes.js
const express = require("express");
const { checkSymptoms } = require("../controllers/ai.controller");

const router = express.Router();

router.post("/symptom-check", checkSymptoms);

module.exports = router;