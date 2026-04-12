const amqp = require('amqplib');
const config = require('../config/config');

const RABBITMQ_URL = process.env.RABBITMQ_URL || config.RABBITMQ_URL;
let connection;
let channel;

const createChannel = async () => {
  if (channel) return channel;
  if (!connection) {
    connection = await amqp.connect(RABBITMQ_URL);
  }
  channel = await connection.createChannel();
  return channel;
};

const publishEvent = async (exchange, routingKey, payload) => {
  const ch = await createChannel();
  await ch.assertExchange(exchange, 'topic', { durable: true });

  const message = Buffer.from(JSON.stringify(payload || {}));
  const published = ch.publish(exchange, routingKey, message, {
    persistent: true,
    contentType: 'application/json',
  });

  if (!published) {
    console.warn(`Failed to publish event ${exchange}:${routingKey}`);
  }

  return published;
};

module.exports = {
  publishEvent,
};
