require('dotenv').config();

const requiredEnv = [
  'MONGO_URI',
  'INTERNAL_SERVICE_KEY',
];

const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Missing required environment variables for notification-service: ${missing.join(', ')}`);
}

module.exports = {
  PORT: process.env.PORT || 5006,
  MONGO_URI: process.env.MONGO_URI,
  SMS_PROVIDER: (process.env.SMS_PROVIDER || 'notifylk').toLowerCase(),
  NOTIFYLK_USER_ID: process.env.NOTIFYLK_USER_ID,
  NOTIFYLK_API_KEY: process.env.NOTIFYLK_API_KEY,
  NOTIFYLK_SENDER_ID: process.env.NOTIFYLK_SENDER_ID,
  NOTIFYLK_BASE_URL: process.env.NOTIFYLK_BASE_URL || 'https://app.notify.lk',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
  TWILIO_MESSAGING_SERVICE_SID: process.env.TWILIO_MESSAGING_SERVICE_SID,
  GMAIL_USER: process.env.GMAIL_USER,
  GMAIL_PASS: process.env.GMAIL_PASS ? process.env.GMAIL_PASS.replace(/\s+/g, '') : undefined,
  INTERNAL_SERVICE_KEY: process.env.INTERNAL_SERVICE_KEY,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:8080',
};
