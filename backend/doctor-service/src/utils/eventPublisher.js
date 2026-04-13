import amqplib from "amqplib";

let connection = null;
let channel = null;

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
const EXCHANGE_NAME = "doctor_events";
const QUEUE_NAME = "doctor_slots_updates";

/**
 * Initialize RabbitMQ connection and channel
 */
export const initializePublisher = async () => {
  try {
    connection = await amqplib.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    // Declare exchange (durable, so it persists)
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });

    console.log("✅ Event publisher initialized");
    return channel;
  } catch (error) {
    console.error("❌ Failed to initialize event publisher:", error.message);
    // Retry after 5 seconds
    setTimeout(initializePublisher, 5000);
  }
};

/**
 * Publish slot update event
 */
export const publishSlotUpdate = async (
  doctorId,
  slots,
  messageType = "slots_updated",
) => {
  if (!channel) {
    console.warn("⚠️ Event channel not ready, skipping publish");
    return;
  }

  try {
    const routingKey = `doctor.${doctorId}.${messageType}`;
    const message = {
      event: messageType,
      timestamp: new Date().toISOString(),
      doctorId,
      slots,
    };

    channel.publish(
      EXCHANGE_NAME,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true },
    );

    console.log(`📢 Published ${messageType} event for doctor ${doctorId}`);
  } catch (error) {
    console.error("❌ Error publishing event:", error.message);
  }
};

/**
 * Close connection gracefully
 */
export const closePublisher = async () => {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    console.log("✅ Event publisher closed");
  } catch (error) {
    console.error("⚠️ Error closing publisher:", error.message);
  }
};
