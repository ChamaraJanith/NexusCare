const amqp = require('amqplib');
const config = require('../config/config');
const VideoSession = require('../models/videoSessionModel');
const videoService = require('./videoService');
const { publishEvent } = require('./eventPublisher');

const RABBITMQ_URL = process.env.RABBITMQ_URL || config.RABBITMQ_URL;
const APPOINTMENT_EXCHANGE = 'appointments';
const APPOINTMENT_QUEUE = 'video.session';
const APPOINTMENT_ROUTING_KEY = 'appointment.online_confirmed';

const DOCTOR_EXCHANGE = 'doctors';
const DOCTOR_QUEUE = 'video.doctor.catalog';
const DOCTOR_UPDATED_ROUTING_KEY = 'doctor.updated';
const DOCTOR_REMOVED_ROUTING_KEY = 'doctor.removed';

const { retryAsync } = require('./retryHelper');

const createConnection = async () => {
  return retryAsync(
    async () => {
      const connection = await amqp.connect(RABBITMQ_URL);
      connection.on('error', (error) => {
        console.error('RabbitMQ connection error:', error);
      });
      connection.on('close', () => {
        console.warn('RabbitMQ connection closed');
      });
      return connection;
    },
    {
      retries: 3,
      initialDelayMs: 250,
      factor: 2,
      onRetry: (attempt, delayMs, error) => {
        console.warn(`Retrying RabbitMQ connect (${attempt}) in ${delayMs}ms after error: ${error.message}`);
      },
    }
  );
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

const processAppointmentOnlineConfirmed = async (payload) => {
  const session = await buildSession(payload);

  await publishEvent('video', 'video.session.created', {
    appointmentId: session.appointmentId,
    roomId: session.roomId,
    roomUrl: session.roomUrl,
    patientId: session.patientId,
    doctorId: session.doctorId,
    patientEmail: session.patientEmail,
    doctorEmail: session.doctorEmail,
    patientPhone: session.patientPhone,
    doctorPhone: payload.doctorPhone || '',
    appointmentType: payload.appointmentType,
    paymentStatus: payload.paymentStatus,
    date: payload.date,
    time: payload.time,
    status: session.status,
  });
};

const startRabbitMQConsumer = async () => {
  const connection = await createConnection();
  const channel = await connection.createChannel();

  await channel.assertExchange(APPOINTMENT_EXCHANGE, 'topic', { durable: true });
  await channel.assertQueue(APPOINTMENT_QUEUE, { durable: true });
  await channel.bindQueue(APPOINTMENT_QUEUE, APPOINTMENT_EXCHANGE, APPOINTMENT_ROUTING_KEY);

  await channel.assertExchange(DOCTOR_EXCHANGE, 'topic', { durable: true });
  await channel.assertQueue(DOCTOR_QUEUE, { durable: true });
  await channel.bindQueue(DOCTOR_QUEUE, DOCTOR_EXCHANGE, DOCTOR_UPDATED_ROUTING_KEY);
  await channel.bindQueue(DOCTOR_QUEUE, DOCTOR_EXCHANGE, DOCTOR_REMOVED_ROUTING_KEY);

  console.log(`📥 Video service RabbitMQ consumer connected, listening for ${APPOINTMENT_ROUTING_KEY}, ${DOCTOR_UPDATED_ROUTING_KEY}, ${DOCTOR_REMOVED_ROUTING_KEY}`);

  await channel.consume(APPOINTMENT_QUEUE, async (msg) => {
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

  await channel.consume(DOCTOR_QUEUE, async (msg) => {
    if (!msg) return;

    try {
      const payload = JSON.parse(msg.content.toString());
      console.log(`📩 Received ${msg.fields.routingKey} event`, payload);

      if (msg.fields.routingKey === DOCTOR_UPDATED_ROUTING_KEY) {
        await videoService.upsertDoctorCatalog(payload);
      } else if (msg.fields.routingKey === DOCTOR_REMOVED_ROUTING_KEY) {
        await videoService.removeDoctorFromCatalog(payload.doctorId);
      } else {
        console.warn('⚠️ Unsupported doctor event routing key:', msg.fields.routingKey);
      }

      channel.ack(msg);
    } catch (err) {
      console.error('❌ Failed to process doctor event:', err);
      const redelivered = msg.fields.redelivered;
      channel.nack(msg, false, !redelivered);
    }
  }, { noAck: false });
};

module.exports = {
  startRabbitMQConsumer,
};
