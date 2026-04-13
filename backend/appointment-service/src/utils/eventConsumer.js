import amqplib from "amqplib";
import AvailabilitySlot from "../models/AvailabilitySlot.js";

let connection = null;
let channel = null;

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
const EXCHANGE_NAME = "doctor_events";
const CONSUMER_QUEUE_NAME = "appointment_service_slots";
const ROUTING_PATTERN = "doctor.*.slots_updated";

/**
 * Initialize RabbitMQ consumer
 */
export const initializeConsumer = async () => {
  try {
    connection = await amqplib.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    // Declare exchange (must match publisher)
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });

    // Declare queue for appointment service
    const queue = await channel.assertQueue(CONSUMER_QUEUE_NAME, {
      durable: true,
    });

    // Bind queue to exchange with routing pattern
    await channel.bindQueue(queue.queue, EXCHANGE_NAME, ROUTING_PATTERN);

    // Consume messages
    await channel.consume(queue.queue, handleSlotUpdateEvent, { noAck: false });

    console.log("✅ Event consumer initialized - listening for slot updates");
  } catch (error) {
    console.error("❌ Failed to initialize event consumer:", error.message);
    // Retry after 5 seconds
    setTimeout(initializeConsumer, 5000);
  }
};

/**
 * Handle incoming slot update events
 */
const handleSlotUpdateEvent = async (msg) => {
  if (!msg) return;

  try {
    const content = JSON.parse(msg.content.toString());
    const { doctorId, slots } = content;

    if (!doctorId || !slots) {
      console.warn("⚠️ Invalid event format, missing doctorId or slots");
      channel.nack(msg, false, false);
      return;
    }

    // Delete old slots for this doctor (to avoid duplicates)
    await AvailabilitySlot.deleteMany({ doctorId });

    // Store new slots
    if (Array.isArray(slots)) {
      const slotsToInsert = slots.map((slot) => {
        // Normalize date: ensure it's always stored at 00:00:00 UTC
        let dateValue = slot.date;
        if (typeof dateValue === "string") {
          // Parse string date (e.g., "2026-04-13" or "2026-04-13T00:00:00Z")
          dateValue = new Date(dateValue);
        }

        // Reset time to midnight UTC
        if (dateValue instanceof Date) {
          const year = dateValue.getUTCFullYear();
          const month = dateValue.getUTCMonth();
          const date = dateValue.getUTCDate();
          dateValue = new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
        }

        return {
          doctorId,
          date: dateValue,
          startTime: slot.startTime,
          slotCount: slot.slotCount || 20,
          bookedCount: slot.bookedCount || 0,
          hospital: slot.hospital || "",
          hospitalId: slot.hospitalId || "",
          appointmentType: (
            slot.slotType ||
            slot.appointmentType ||
            "PHYSICAL"
          ).toUpperCase(),
          platform: slot.platform || "",
          serviceFee: slot.serviceFee || 0,
          syncedAt: new Date(),
          isActive: true,
        };
      });

      await AvailabilitySlot.insertMany(slotsToInsert);
      console.log(
        `✅ Synced ${slotsToInsert.length} availability slots for doctor ${doctorId}`,
      );
    }

    // Acknowledge message
    channel.ack(msg);
  } catch (error) {
    console.error("❌ Error handling slot update event:", error.message);
    // Nack and requeue if there's an error
    channel.nack(msg, false, true);
  }
};

/**
 * Close consumer gracefully
 */
export const closeConsumer = async () => {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    console.log("✅ Event consumer closed");
  } catch (error) {
    console.error("⚠️ Error closing consumer:", error.message);
  }
};
