const express = require('express');
const router = express.Router();

// Controller Functions Import කිරීම
const { sendEmail, sendSMS } = require('../controllers/notificationController');

/**
 * Route: POST /api/notifications/send
 * Description: Emails trigger කිරීමට
 */
router.post('/send', sendEmail);

/**
 * Route: POST /api/notifications/send-sms
 * Description: SMS trigger කිරීමට
 */
router.post('/send-sms', sendSMS);

module.exports = router;