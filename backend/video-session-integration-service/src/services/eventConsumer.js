const amqp = require('amqplib');
const config = require('../config/config');
const VideoSession = require('../models/videoSessionModel');
const videoService = require('./videoService');
const notificationClient = require('./notificationClient');

const RABBITMQ_URL = process.env.RABBITMQ_URL || config.RABBITMQ_URL;
const EXCHANGE = 'appointments';
const QUEUE = 'video.session';
const ROUTING_KEY = 'appointment.online_confirmed';

const createConnection = async () => {
  const connection = await amqp.connect(RABBITMQ_URL);
  connection.on('error', (error) => {
    console.error('RabbitMQ connection error:', error);
  });
  connection.on('close', () => {
    console.warn('RabbitMQ connection closed');
  });
  return connection;
};

const buildSession = async (payload) => {
  const appointmentId = payload.appointmentId ? String(payload.appointmentId).replaceAll(/[^A-Za-z0-9_-]/g, '') : null;
  if (!appointmentId || !payload.patientId || !payload.doctorId) {
    throw new Error('Invalid appointment payload: appointmentId, patientId, and doctorId are required');
  }

  const existingSession = await VideoSession.findOne({ appointmentId, status: 'ACTIVE' });
  if (existingSession) {
    console.log(`⚠️ Existing active session found for appointment ${appointmentId}`);
    return existingSession;
  }

  const sessionData = await videoService.generateNeuralLink(payload.patientId, payload.doctorId, appointmentId);
  const videoSession = new VideoSession({
    roomId: sessionData.roomId,
    roomUrl: sessionData.roomUrl,
    appointmentId,
    patientId: payload.patientId,
    doctorId: payload.doctorId,
    patientEmail: payload.patientEmail || payload.email || '',
    doctorEmail: payload.doctorEmail || '',
    patientPhone: payload.patientPhone || payload.phone || '',
    status: 'ACTIVE',
    startedAt: new Date(),
    meta: {
      appointmentType: payload.appointmentType,
      paymentStatus: payload.paymentStatus,
    },
  });

  await videoSession.save();
  return videoSession;
};

const notifyParticipants = async (session, payload) => {
  const recipients = [...new Set([session.patientEmail, session.doctorEmail].filter(Boolean))];
  const emailTasks = recipients.map(async (email) => {
    try {
      await notificationClient.sendEmail({
        email,
        subject: 'NexusCare Video Session Ready',
        message: `Your online consultation session is ready. Join here: ${session.roomUrl}`,
      });
      console.log(`✅ Notification email sent to ${email}`);
    } catch (err) {
      console.warn(`⚠️ Failed to send notification email to ${email}:`, err.message || err);
    }
  });

  const smsTasks = [];
  if (session.patientPhone) {
    smsTasks.push(notificationClient.sendSms({
      phoneNumber: session.patientPhone,
      message: `Your NexusCare video session is ready. Join here: ${session.roomUrl}`,
    }));
  }

  await Promise.allSettled([...emailTasks, ...smsTasks]);
};

const processAppointmentOnlineConfirmed = async (payload) => {
  const session = await buildSession(payload);
  await notifyParticipants(session, payload);
};

const startRabbitMQConsumer = async () => {
  const connection = await createConnection();
  const channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

  console.log(`📥 Video service RabbitMQ consumer connected, listening for ${ROUTING_KEY}`);

  await channel.consume(QUEUE, async (msg) => {
    if (!msg) return;

    try {
      const payload = JSON.parse(msg.content.toString());
      console.log(`📩 Received ${msg.fields.routingKey} event`, payload);
      await processAppointmentOnlineConfirmed(payload);
      channel.ack(msg);
    } catch (err) {
      console.error('❌ Failed to process appointment.online_confirmed event:', err);
      const redelivered = msg.fields.redelivered;
      channel.nack(msg, false, !redelivered);
    }
  }, { noAck: false });
};

module.exports = {
  startRabbitMQConsumer,
};
