const amqp = require('amqplib');
const config = require('../config/config');
const {
  sendRegistrationEmailPayload,
  sendSMSPayload,
  processAppointmentNotificationEvent,
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

  console.log(`📥 RabbitMQ consumer connected, listening for ${USER_QUEUE} and ${APPOINTMENT_QUEUE}`);

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
};

module.exports = {
  startRabbitMQConsumer,
};
