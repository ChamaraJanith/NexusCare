const express = require('express');
const cors = require('cors');
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

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'notification-service',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', async (req, res) => {
  try {
    await connectDB(config.MONGO_URI);
    res.status(200).json({ success: true, ready: true });
  } catch (error) {
    res.status(503).json({ success: false, ready: false, error: error.message });
  }
});

app.use('/api/notifications', notificationRoutes);

connectDB(config.MONGO_URI).catch((err) => {
  console.error('❌ Notification DB connection failed:', err.message);
  process.exit(1);
});

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`🔔 Notification Service Active on Port ${PORT}`);
});
