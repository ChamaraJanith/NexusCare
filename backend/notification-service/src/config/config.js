require('dotenv').config();

const requiredEnv = [
  'MONGO_URI',
  'INTERNAL_SERVICE_KEY',
];

const smsProvider = (process.env.SMS_PROVIDER || 'notifylk').toLowerCase();
const emailEnabled = process.env.EMAIL_ENABLED === 'true';
const isTest = process.env.NODE_ENV === 'test';

if (!isTest) {
  if (smsProvider === 'notifylk') {
    requiredEnv.push('NOTIFYLK_USER_ID', 'NOTIFYLK_API_KEY');
  }

  if (smsProvider === 'twilio') {
    requiredEnv.push('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN');
  }

  if (emailEnabled) {
    requiredEnv.push('GMAIL_USER', 'GMAIL_PASS');
  }
}

const missing = requiredEnv.filter((key) => !process.env[key]);

if (!isTest) {
  if (smsProvider === 'twilio' && !process.env.TWILIO_PHONE_NUMBER && !process.env.TWILIO_MESSAGING_SERVICE_SID) {
    missing.push('TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables for notification-service: ${missing.join(', ')}`);
  }
}

module.exports = {
  PORT: process.env.PORT || 5006,
  MONGO_URI: process.env.MONGO_URI,
  SMS_PROVIDER: smsProvider,
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
  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:8080',
  EMAIL_ENABLED: emailEnabled,
};
