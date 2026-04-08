const { createInternalApiClient } = require('./internalApiClient');

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL;
if (!NOTIFICATION_SERVICE_URL) {
  throw new Error('NOTIFICATION_SERVICE_URL must be configured for video-service');
}
const notificationApi = createInternalApiClient(NOTIFICATION_SERVICE_URL);

const sendEmail = async ({ email, subject, message }) => {
  return notificationApi.post('/api/notifications/send', {
    email,
    subject,
    message,
  });
};

const sendSms = async ({ phoneNumber, message }) => {
  return notificationApi.post('/api/notifications/send-sms', {
    phoneNumber,
    message,
  });
};

module.exports = { sendEmail, sendSms };
