const express = require('express');
const router = express.Router();
const { checkSymptoms } = require('../controllers/ai.controller');

router.post('/symptom-check', checkSymptoms);

module.exports = router;