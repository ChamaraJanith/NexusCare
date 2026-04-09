require('dotenv').config();

const requiredEnv = [
  'MONGO_URI',
  'DOCTOR_SERVICE_URL',
  'INTERNAL_SERVICE_KEY',
];

const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Missing required environment variables for video-session-integration-service: ${missing.join(', ')}`);
}

module.exports = {
  PORT: process.env.PORT || 5005,
  MONGO_URI: process.env.MONGO_URI,
  DOCTOR_SERVICE_URL: process.env.DOCTOR_SERVICE_URL,
  INTERNAL_SERVICE_KEY: process.env.INTERNAL_SERVICE_KEY,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:9000',
};
