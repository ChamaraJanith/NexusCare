import amqplib from "amqplib";
import AvailabilitySlot from "../models/AvailabilitySlot.js";
import DoctorSnapshot from "../models/DoctorSnapshot.js";

let connection = null;
let channel = null;

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
const EXCHANGE_NAME = "doctor_events";
const CONSUMER_QUEUE_NAME = "appointment_service_slots";
const ROUTING_PATTERN = "doctor.#";

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
    await channel.consume(queue.queue, handleEvent, { noAck: false });

    console.log("✅ Event consumer initialized - listening for doctor events");
  } catch (error) {
    console.error("❌ Failed to initialize event consumer:", error.message);
    // Retry after 5 seconds
    setTimeout(initializeConsumer, 5000);
  }
};

/**
 * Route incoming events by routing key
 */
const handleEvent = async (msg) => {
  if (!msg) return;
  const routingKey = msg.fields?.routingKey || "";

  if (routingKey.endsWith("slots_updated")) {
    return handleSlotUpdateEvent(msg);
  }
  if (routingKey === "doctor.updated") {
    return handleDoctorUpdatedEvent(msg);
  }
  if (routingKey === "doctor.removed") {
    return handleDoctorRemovedEvent(msg);
  }

  // Unknown event — ack and ignore
  channel.ack(msg);
};

/**
 * Handle doctor.updated — upsert local DoctorSnapshot
 */
const handleDoctorUpdatedEvent = async (msg) => {
  try {
    const payload = JSON.parse(msg.content.toString());
    const { doctorId } = payload;

    if (!doctorId) {
      channel.nack(msg, false, false);
      return;
    }

    await DoctorSnapshot.findOneAndUpdate(
      { doctorId },
      {
        $set: {
          doctorId,
          name: payload.name || "",
          email: payload.email || null,
          specialization: payload.specialization || "",
          hospital: payload.hospital || "",
          location: payload.location || "",
          profileImage: payload.profileImage || null,
          consultationFee: payload.consultationFee || 0,
          isActive: payload.isActive !== false,
          syncedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    console.log(`✅ DoctorSnapshot upserted for doctor ${doctorId}`);
    channel.ack(msg);
  } catch (error) {
    console.error("❌ Error handling doctor.updated event:", error.message);
    channel.nack(msg, false, true);
  }
};

/**
 * Handle doctor.removed — mark snapshot inactive
 */
const handleDoctorRemovedEvent = async (msg) => {
  try {
    const { doctorId } = JSON.parse(msg.content.toString());
    if (doctorId) {
      await DoctorSnapshot.findOneAndUpdate(
        { doctorId },
        { $set: { isActive: false, syncedAt: new Date() } }
      );
      console.log(`✅ DoctorSnapshot deactivated for doctor ${doctorId}`);
    }
    channel.ack(msg);
  } catch (error) {
    console.error("❌ Error handling doctor.removed event:", error.message);
    channel.nack(msg, false, true);
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
        // Normalize date: always store as YYYY-MM-DD string to match schema type
        let dateValue = slot.date;
        if (dateValue instanceof Date) {
          dateValue = dateValue.toISOString().split("T")[0];
        } else if (typeof dateValue === "string") {
          // Strip any time component — keep only YYYY-MM-DD
          dateValue = dateValue.split("T")[0];
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
          hospitalFee: slot.hospitalFee || 0,
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
