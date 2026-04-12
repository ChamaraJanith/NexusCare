const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./config/config');
const videoService = require('./services/videoService');
const verifyInternalKey = require('./middleware/verifyInternalKey');
const videoRoutes = require('./routes/videoRoutes');
const { startRabbitMQConsumer } = require('./services/eventConsumer');

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = config.ALLOWED_ORIGINS
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    const devFallbackOrigins = [
      'http://localhost:9000',
      'http://127.0.0.1:9000',
      'http://host.docker.internal:9000',
      'http://localhost:8080',
      'http://127.0.0.1:8080',
    ];

    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin) || devFallbackOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn('CORS origin blocked:', origin);
    return callback(new Error('CORS policy violation'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-internal-service-key'],
}));
app.use(express.json());

mongoose.connect(config.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected Successfully');
    try {
      await startRabbitMQConsumer();
    } catch (err) {
      console.error('❌ RabbitMQ consumer failed to start:', err);
    }
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

app.use('/api/video', videoRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'video-session-integration-service',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', async (req, res, next) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const doctorStatus = await videoService.getDoctorCatalogStatus();
    const isDoctorServiceUp = doctorStatus.doctorService === 'ok';

    if (isMongoConnected && isDoctorServiceUp) {
      return res.status(200).json({
        success: true,
        ready: true,
        mongo: 'connected',
        doctorService: doctorStatus,
      });
    }

    return res.status(503).json({
      success: false,
      ready: false,
      mongo: isMongoConnected ? 'connected' : 'disconnected',
      doctorService: doctorStatus,
    });
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  console.error('🚨 Video Service error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    details: err.details || undefined,
  });
});

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`🚀 MS4 Video Node Active on Port ${PORT}`);
});

module.exports = app;