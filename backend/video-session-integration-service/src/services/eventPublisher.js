const amqp = require('amqplib');
const config = require('../config/config');
const { retryAsync } = require('./retryHelper');

const RABBITMQ_URL = process.env.RABBITMQ_URL || config.RABBITMQ_URL;
let connection;
let channel;

const resetConnection = () => {
  connection = null;
  channel = null;
};

const createChannel = async () => {
  if (channel) return channel;
  if (!connection) {
    connection = await amqp.connect(RABBITMQ_URL);
    connection.on('error', (error) => {
      console.error('RabbitMQ connection error:', error);
      resetConnection();
    });
    connection.on('close', () => {
      console.warn('RabbitMQ connection closed');
      resetConnection();
    });
  }
  channel = await connection.createChannel();
  channel.on('error', (error) => {
    console.error('RabbitMQ channel error:', error);
    resetConnection();
  });
  channel.on('close', () => {
    console.warn('RabbitMQ channel closed');
    resetConnection();
  });
  return channel;
};

const publishEvent = async (exchange, routingKey, payload) => {
  if (!exchange) {
    throw new Error('RabbitMQ exchange is required');
  }
  if (!routingKey) {
    throw new Error('RabbitMQ routingKey is required');
  }

  return retryAsync(
    async () => {
      const ch = await createChannel();
      await ch.assertExchange(exchange, 'topic', { durable: true });

      const message = Buffer.from(JSON.stringify(payload || {}));
      const published = ch.publish(exchange, routingKey, message, {
        persistent: true,
        contentType: 'application/json',
      });

      if (!published) {
        throw new Error(`Failed to publish event ${exchange}:${routingKey}`);
      }

      return published;
    },
    {
      retries: 3,
      initialDelayMs: 250,
      factor: 2,
      onRetry: (attempt, delayMs, error) => {
        console.warn(`Retrying RabbitMQ publish (${attempt}) in ${delayMs}ms after error: ${error.message}`);
      },
    }
  );
};

module.exports = {
  publishEvent,
};
