const express = require("express");
const router = express.Router();
const {
  sendEmail,
  sendSMS,
  sendRegistrationEmail,
  logNotification,
} = require("../controllers/notificationController");
const validate = require("../middleware/validate");
const {
  sendEmailSchema,
  sendSmsSchema,
  sendRegistrationEmailSchema,
  logNotificationSchema,
} = require("../validators/notificationValidator");
router.post("/send", validate(sendEmailSchema), sendEmail);

router.post(
  "/register",
  validate(sendRegistrationEmailSchema),
  sendRegistrationEmail,
);
router.post("/log", validate(logNotificationSchema), logNotification);

router.post("/send-sms", validate(sendSmsSchema), sendSMS);

module.exports = router;
