const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const QUEUE = 'user.registered';

let channel;
let connection;

const createChannel = async () => {
  if (channel) {
    return channel;
  }

  connection = await amqp.connect(RABBITMQ_URL);
  connection.on('error', (err) => {
    console.error('RabbitMQ connection error:', err);
    channel = null;
  });
  connection.on('close', () => {
    console.warn('RabbitMQ connection closed');
    channel = null;
  });

  const ch = await connection.createChannel();
  await ch.assertQueue(QUEUE, { durable: true });
  channel = ch;
  return channel;
};

const publishRegistrationEvent = async (payload) => {
  const ch = await createChannel();
  const published = ch.sendToQueue(QUEUE, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
  });

  if (!published) {
    throw new Error('Failed to publish registration event to RabbitMQ');
  }

  console.log(`📤 Published user.registered event for ${payload.email || payload.userId}`);
  return published;
};

const publishDoctorRegisteredEvent = async (payload) => {
  const ch = await createChannel();
  const doctorQueue = 'doctor.registered';
  await ch.assertQueue(doctorQueue, { durable: true });
  
  const published = ch.sendToQueue(doctorQueue, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
  });

  if (!published) {
    throw new Error('Failed to publish doctor.registered event to RabbitMQ');
  }

  console.log(`📤 Published doctor.registered event for ${payload.email || payload.doctorId}`);
  return published;
};

module.exports = {
  publishRegistrationEvent,
  publishDoctorRegisteredEvent,
};
