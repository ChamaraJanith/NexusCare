import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
let connection;
let channel;

const createChannel = async () => {
  if (channel) return channel;
  if (!connection) {
    connection = await amqp.connect(RABBITMQ_URL);
    connection.on('error', (error) => console.error('RabbitMQ connection error:', error));
    connection.on('close', () => console.warn('RabbitMQ connection closed'));
  }
  channel = await connection.createChannel();
  return channel;
};

export const publishEvent = async (exchange, routingKey, payload) => {
  if (!exchange) {
    throw new Error('RabbitMQ exchange is required');
  }
  if (!routingKey) {
    throw new Error('RabbitMQ routingKey is required');
  }

  const ch = await createChannel();
  await ch.assertExchange(exchange, 'topic', { durable: true });

  const published = ch.publish(
    exchange,
    routingKey,
    Buffer.from(JSON.stringify(payload || {})),
    {
      persistent: true,
      contentType: 'application/json',
    }
  );

  if (!published) {
    console.warn(`🐇 RabbitMQ publish returned false for ${exchange}:${routingKey}`);
  }

  return published;
};
