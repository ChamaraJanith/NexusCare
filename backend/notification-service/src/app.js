const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./config/config');
const connectDB = require('./config/db');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

const corsOrigins = config.ALLOWED_ORIGINS
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-internal-service-key'],
}));
app.use(express.json());

const requireInternalServiceKey = (req, res, next) => {
  const internalKey = req.headers['x-internal-service-key'];
  if (!internalKey || internalKey !== config.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }
  next();
};

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'notification-service',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  if (isConnected) {
    return res.status(200).json({ success: true, ready: true });
  }
  return res.status(503).json({ success: false, ready: false, error: 'MongoDB not connected' });
});

app.use('/api/notifications', requireInternalServiceKey, notificationRoutes);

app.use((err, req, res, next) => {
  console.error('🚨 Notification Service error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;

if (require.main === module) {
  connectDB(config.MONGO_URI)
    .then(() => {
      const PORT = config.PORT;
      app.listen(PORT, () => {
        console.log(`🔔 Notification Service Active on Port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('❌ Notification DB connection failed:', err.message);
      process.exit(1);
    });
}
