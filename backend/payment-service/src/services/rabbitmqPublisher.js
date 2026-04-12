const amqp = require("amqplib");

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@rabbitmq:5672";

let channel;

const createChannel = async () => {
  if (channel) return channel;

  const connection = await amqp.connect(RABBITMQ_URL);
  connection.on("error", (err) => {
    console.error("RabbitMQ connection error:", err);
  });
  connection.on("close", () => {
    console.warn("RabbitMQ connection closed");
    channel = null;
  });

  channel = await connection.createChannel();
  return channel;
};

const publishEvent = async (exchange, routingKey, payload) => {
  const ch = await createChannel();
  await ch.assertExchange(exchange, "topic", { durable: true });
  const message = Buffer.from(JSON.stringify(payload));
  const published = ch.publish(exchange, routingKey, message, { persistent: true });
  if (!published) {
    console.warn(`⚠️ RabbitMQ publish returned false for ${exchange}.${routingKey}`);
  }
  return published;
};

module.exports = { publishEvent };