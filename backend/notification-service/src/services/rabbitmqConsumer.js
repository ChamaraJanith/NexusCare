const amqp = require('amqplib');
const config = require('../config/config');
const {
  sendRegistrationEmailPayload,
  sendSMSPayload,
  processAppointmentNotificationEvent,
  processVideoNotificationEvent,
  processPaymentNotificationEvent,
} = require('../controllers/notificationController');

const RABBITMQ_URL = process.env.RABBITMQ_URL || config.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const USER_QUEUE = 'user.registered';
const APPOINTMENT_EXCHANGE = 'appointments';
const APPOINTMENT_QUEUE = 'appointment.notifications';
const APPOINTMENT_ROUTING_KEYS = [
  'appointment.created',
  'appointment.confirmed',
  'appointment.rejected',
];
const VIDEO_EXCHANGE = 'video';
const VIDEO_QUEUE = 'video.notifications';
const VIDEO_ROUTING_KEYS = [
  'video.session.created',
  'video.session.ended',
];

const PAYMENTS_EXCHANGE = 'payments';
const PAYMENTS_QUEUE = 'payment.notifications';
const PAYMENTS_ROUTING_KEYS = ['payment.success', 'payment.failed'];

const startRabbitMQConsumer = async () => {
  const connection = await amqp.connect(RABBITMQ_URL);
  connection.on('error', (error) => {
    console.error('RabbitMQ connection error:', error);
  });
  connection.on('close', () => {
    console.warn('RabbitMQ connection closed');
  });

  const channel = await connection.createChannel();
  await channel.assertQueue(USER_QUEUE, { durable: true });
  await channel.assertExchange(APPOINTMENT_EXCHANGE, 'topic', { durable: true });
  await channel.assertQueue(APPOINTMENT_QUEUE, { durable: true });

  for (const routingKey of APPOINTMENT_ROUTING_KEYS) {
    await channel.bindQueue(APPOINTMENT_QUEUE, APPOINTMENT_EXCHANGE, routingKey);
  }

  await channel.assertExchange(VIDEO_EXCHANGE, 'topic', { durable: true });
  await channel.assertQueue(VIDEO_QUEUE, { durable: true });

  for (const routingKey of VIDEO_ROUTING_KEYS) {
    await channel.bindQueue(VIDEO_QUEUE, VIDEO_EXCHANGE, routingKey);
  }

    await channel.assertExchange(PAYMENTS_EXCHANGE, 'topic', { durable: true });
  await channel.assertQueue(PAYMENTS_QUEUE, { durable: true });

  for (const routingKey of PAYMENTS_ROUTING_KEYS) {
    await channel.bindQueue(PAYMENTS_QUEUE, PAYMENTS_EXCHANGE, routingKey);
  }

  console.log(`📥 RabbitMQ consumer connected, listening for ${USER_QUEUE}, ${APPOINTMENT_QUEUE}, ${VIDEO_QUEUE}, and ${PAYMENTS_QUEUE}`);
  channel.consume(
    USER_QUEUE,
    async (msg) => {
      if (!msg) return;

      try {
        const payload = JSON.parse(msg.content.toString());
        console.log('📩 Received user.registered event', payload);

        if (payload.email) {
          await sendRegistrationEmailPayload(payload);
        }

        if (payload.phone) {
          const displayRole = payload.role === 'doctor' ? 'Doctor' : 'Patient';
          const message = `Hello ${payload.name}, your ${displayRole.toLowerCase()} account has been created successfully on NexusCare.`;
          await sendSMSPayload({ phoneNumber: payload.phone, message });
        }

        channel.ack(msg);
      } catch (error) {
        console.error('❌ Failed to process user.registered event', error);
        const redelivered = msg.fields.redelivered;
        channel.nack(msg, false, !redelivered);
      }
    },
    { noAck: false }
  );

  channel.consume(
    APPOINTMENT_QUEUE,
    async (msg) => {
      if (!msg) return;

      try {
        const payload = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;
        console.log(`📩 Received ${routingKey} event`, payload);

        await processAppointmentNotificationEvent(payload, routingKey);

        channel.ack(msg);
      } catch (error) {
        console.error('❌ Failed to process appointment event', error);
        const redelivered = msg.fields.redelivered;
        channel.nack(msg, false, !redelivered);
      }
    },
    { noAck: false }
  );

   channel.consume(
    PAYMENTS_QUEUE,
    async (msg) => {
      if (!msg) return;

      try {
        const payload = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;
        console.log(`📩 Received ${routingKey} event`, payload);

        await processPaymentNotificationEvent(payload, routingKey);

        channel.ack(msg);
      } catch (error) {
        console.error('❌ Failed to process payment event', error);
        const redelivered = msg.fields.redelivered;
        channel.nack(msg, false, !redelivered);
      }
    },
    { noAck: false }
  );
};

module.exports = {
  startRabbitMQConsumer,
};
