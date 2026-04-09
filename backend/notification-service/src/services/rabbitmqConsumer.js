const amqp = require('amqplib');
const config = require('../config/config');
const {
  sendRegistrationEmailPayload,
  sendSMSPayload,
} = require('../controllers/notificationController');

const RABBITMQ_URL = process.env.RABBITMQ_URL || config.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const QUEUE = 'user.registered';

const startRabbitMQConsumer = async () => {
  const connection = await amqp.connect(RABBITMQ_URL);
  connection.on('error', (error) => {
    console.error('RabbitMQ connection error:', error);
  });
  connection.on('close', () => {
    console.warn('RabbitMQ connection closed');
  });

  const channel = await connection.createChannel();
  await channel.assertQueue(QUEUE, { durable: true });

  console.log(`📥 RabbitMQ consumer connected, listening for ${QUEUE}`);

  channel.consume(
    QUEUE,
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
};

module.exports = {
  startRabbitMQConsumer,
};
