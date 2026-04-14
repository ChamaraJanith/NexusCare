import amqplib from "amqplib";
import AvailabilitySlot from "../models/AvailabilitySlot.js";
import DoctorSnapshot from "../models/DoctorSnapshot.js";
import Appointment from "../models/Appointment.js";
import { publishEvent } from "../services/eventPublisher.js";

let connection = null;
let channel = null;

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
const EXCHANGE_NAME = "doctor_events";
const CONSUMER_QUEUE_NAME = "appointment_service_slots";
const ROUTING_PATTERN = "doctor.#";

// Payment events
const PAYMENT_EXCHANGE = "payments";
const PAYMENT_QUEUE = "appointment_service_payments";
const PAYMENT_ROUTING = "payment.#";

/**
 * Initialize RabbitMQ consumer
 */
export const initializeConsumer = async () => {
  try {
    connection = await amqplib.connect(RABBITMQ_URL);
    connection.on("error", (err) => {
      console.error("❌ RabbitMQ connection error:", err.message);
      connection = null; channel = null;
      setTimeout(initializeConsumer, 5000);
    });
    connection.on("close", () => {
      console.warn("⚠️ RabbitMQ connection closed, reconnecting...");
      connection = null; channel = null;
      setTimeout(initializeConsumer, 5000);
    });

    channel = await connection.createChannel();

    // ── Doctor events (unchanged) ──────────────────────────────────────────────
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
    const doctorQueue = await channel.assertQueue(CONSUMER_QUEUE_NAME, { durable: true });
    await channel.bindQueue(doctorQueue.queue, EXCHANGE_NAME, ROUTING_PATTERN);
    await channel.consume(doctorQueue.queue, handleEvent, { noAck: false });

    // ── Payment events — update paymentStatus when appointment-service was down ─
    await channel.assertExchange(PAYMENT_EXCHANGE, "topic", { durable: true });
    const paymentQueue = await channel.assertQueue(PAYMENT_QUEUE, { durable: true });
    await channel.bindQueue(paymentQueue.queue, PAYMENT_EXCHANGE, PAYMENT_ROUTING);
    await channel.consume(paymentQueue.queue, handlePaymentEvent, { noAck: false });

    console.log("✅ Event consumer initialized - listening for doctor + payment events");
  } catch (error) {
    console.error("❌ Failed to initialize event consumer:", error.message);
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
 * Handle payment.appointment_status_update events.
 * This fires when payment-service couldn't reach appointment-service via HTTP
 * (e.g. appointment-service was down). Guarantees eventual consistency.
 */
const handlePaymentEvent = async (msg) => {
  if (!msg) return;
  try {
    const payload = JSON.parse(msg.content.toString());
    const routingKey = msg.fields?.routingKey || "";

    if (routingKey === "payment.appointment_status_update") {
      const { appointmentId, paymentStatus } = payload;
      if (appointmentId && paymentStatus) {
        const updated = await Appointment.findOneAndUpdate(
          { $or: [{ _id: appointmentId }, { appointmentId }] },
          { paymentStatus },
          { new: true }
        );
        if (updated) {
          console.log(`✅ [event] paymentStatus updated: ${appointmentId} → ${paymentStatus}`);
          // Trigger online_confirmed if conditions met
          if (
            updated.paymentStatus === "PAID" &&
            updated.status === "CONFIRMED" &&
            updated.appointmentType === "ONLINE"
          ) {
            publishEvent("appointments", "appointment.online_confirmed", {
              appointmentId: updated.appointmentId,
              id: updated._id?.toString(),
              patientId: updated.patientId,
              doctorId: updated.doctorId,
              appointmentType: updated.appointmentType,
              status: updated.status,
              paymentStatus: updated.paymentStatus,
            }).catch((e) => console.warn("⚠️ Failed to publish online_confirmed:", e.message));
          }
        }
      }
    }
    channel.ack(msg);
  } catch (err) {
    console.error("❌ Error handling payment event:", err.message);
    channel.nack(msg, false, !msg.fields.redelivered);
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
