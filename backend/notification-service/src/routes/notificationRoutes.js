const express = require('express');
const router = express.Router();

// 💡 Controller එකෙන් අවශ්‍ය Functions ටික හරියට Import කරගන්න
const { sendEmail, sendSMS } = require('../controllers/notificationController');

// 1. POST /api/notifications/send (Email යැවීමට)
router.post('/send', sendEmail);

// 2. POST /api/notifications/send-sms (SMS යැවීමට)
router.post('/send-sms', sendSMS);

module.exports = router;