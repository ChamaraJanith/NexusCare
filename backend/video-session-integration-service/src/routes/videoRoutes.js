// videoRoutes.js
const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');

router.post('/initialize-link', videoController.initializeSession);

// මෙතන controller එකේ function එක පාවිච්චි කරන්න
router.get('/sessions', videoController.getSessions);

module.exports = router;