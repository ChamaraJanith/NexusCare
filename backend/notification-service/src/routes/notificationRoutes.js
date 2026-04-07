const express = require('express');
const router = express.Router();

// Controller Functions Import කිරීම
const {
  sendEmail,
  sendSMS,
  sendRegistrationEmail,
  logNotification,
} = require('../controllers/notificationController');

/**
 * Route: POST /api/notifications/send
 * Description: Emails trigger කිරීමට
 */
router.post('/send', sendEmail);

/**
 * Route: POST /api/notifications/register
 * Description: New doctor/patient registration email යැවීමට
 */
router.post('/register', sendRegistrationEmail);

/**
 * Route: POST /api/notifications/log
 * Description: Persist notification events in the notification database
 */
router.post('/log', logNotification);

/**
 * Route: POST /api/notifications/send-sms
 * Description: SMS trigger කිරීමට
 */
router.post('/send-sms', sendSMS);

module.exports = router;