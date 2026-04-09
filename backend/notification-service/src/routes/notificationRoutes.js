const express = require('express');
const router = express.Router();

// Controller Functions Import
const {
  sendEmail,
  sendSMS,
  sendRegistrationEmail,
  logNotification,
} = require('../controllers/notificationController');
const validate = require('../middleware/validate');
const {
  sendEmailSchema,
  sendSmsSchema,
  sendRegistrationEmailSchema,
  logNotificationSchema,
} = require('../validators/notificationValidator');

/**
 * Route: POST /api/notifications/send
 * Description: Emails trigger කිරීමට
 */
router.post('/send', validate(sendEmailSchema), sendEmail);

/**
 * Route: POST /api/notifications/register
 * Description: New doctor/patient registration email යැවීමට
 */
router.post('/register', validate(sendRegistrationEmailSchema), sendRegistrationEmail);

/**
 * Route: POST /api/notifications/log
 * Description: Persist notification events in the notification database
 */
router.post('/log', validate(logNotificationSchema), logNotification);

/**
 * Route: POST /api/notifications/send-sms
 * Description: SMS trigger කිරීමට
 */
router.post('/send-sms', validate(sendSmsSchema), sendSMS);

module.exports = router;