/**
 * Appointment Event Consumer (Payment Service)
 *
 * Listens to appointment.# events from RabbitMQ and keeps a local
 * AppointmentSnapshot in sync. This is the standard read-replica pattern
 * for microservices — each service owns the data it needs.
 */

const amqp = require("amqplib");
const { upsertSnapshot } = require("./appointmentCache");

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@rabbitmq:5672";
const EXCHANGE = "appointments";
const QUEUE = "payment_service_appointments";
const ROUTING_PATTERN = "appointment.#";

let connection = null;
let channel = null;

const handleEvent = async (msg) => {
  if (!msg) return;
  try {
    const payload = JSON.parse(msg.content.toString());
    await upsertSnapshot(payload);
    console.log(`✅ [payment-svc] AppointmentSnapshot synced: ${payload.appointmentId || payload.id}`);
    channel.ack(msg);
  } catch (err) {
    console.error("❌ [payment-svc] Error processing appointment event:", err.message);
    channel.nack(msg, false, !msg.fields.redelivered);
  }
};

const startConsumer = async () => {
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    connection.on("error", (err) => {
      console.error("RabbitMQ error (payment consumer):", err.message);
      connection = null; channel = null;
      setTimeout(startConsumer, 5000);
    });
    connection.on("close", () => {
      console.warn("RabbitMQ closed (payment consumer), reconnecting...");
      connection = null; channel = null;
      setTimeout(startConsumer, 5000);
    });

    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE, "topic", { durable: true });
    const q = await channel.assertQueue(QUEUE, { durable: true });
    await channel.bindQueue(q.queue, EXCHANGE, ROUTING_PATTERN);
    await channel.consume(q.queue, handleEvent, { noAck: false });

    console.log("✅ [payment-svc] Appointment event consumer started");
  } catch (err) {
    console.error("❌ [payment-svc] Failed to start appointment consumer:", err.message);
    setTimeout(startConsumer, 5000);
  }
};

module.exports = { startConsumer };
