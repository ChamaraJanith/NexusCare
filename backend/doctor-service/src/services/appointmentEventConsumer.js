/**
 * Appointment + Payment Event Consumer (Doctor Service)
 *
 * Subscribes to two exchanges:
 *   - "appointments" (appointment.#)  → keeps AppointmentRequest snapshot in sync
 *   - "payments"     (payment.#)      → updates paymentStatus on AppointmentRequest
 *
 * This gives doctor-service a fully self-sufficient read-replica so the
 * Consultations and Schedule pages work even when appointment-service is down.
 */

import amqp from "amqplib";
import AppointmentRequest from "../models/AppointmentRequest.js";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@rabbitmq:5672";

let connection = null;
let channel = null;

// ── Upsert helper ─────────────────────────────────────────────────────────────
const upsertAppointmentRequest = async (payload) => {
  const id = payload.appointmentId || payload.id;
  if (!id) return;

  const $set = {
    appointmentId:   payload.appointmentId || id,
    mongoId:         payload.id || null,
    doctorId:        payload.doctorId || "",
    patientId:       payload.patientId || "",
    patientName:     payload.patientName || "",
    patientEmail:    payload.patientEmail || "",
    patientPhone:    payload.patientPhone || "",
    date:            payload.date || "",
    time:            payload.time || "",
    appointmentType: payload.appointmentType || "PHYSICAL",
    status:          payload.status || "PENDING",
    paymentStatus:   payload.paymentStatus || "PENDING",
    queueNumber:     payload.queueNumber ?? null,
    syncedAt:        new Date(),
  };

  // Only overwrite charges when the event actually carries them
  if (payload.charges && typeof payload.charges === "object") {
    const { doctorFee, hospitalFee, serviceFee, total } = payload.charges;
    if (Number(doctorFee) > 0 || Number(hospitalFee) > 0 || Number(serviceFee) > 0 || Number(total) > 0) {
      $set.charges = payload.charges;
    }
  }

  await AppointmentRequest.findOneAndUpdate(
    { $or: [{ appointmentId: id }, { mongoId: payload.id }] },
    { $set },
    { upsert: true, new: true }
  );
};

// ── appointment.# handler ─────────────────────────────────────────────────────
const handleAppointmentEvent = async (msg) => {
  if (!msg) return;
  try {
    const payload = JSON.parse(msg.content.toString());
    const routingKey = msg.fields?.routingKey || "";

    if (!payload.appointmentId && !payload.id) {
      console.warn("⚠️ [doctor-svc] appointment event missing id — discarding");
      channel.nack(msg, false, false);
      return;
    }

    const syncRoutes = [
      "appointment.created",
      "appointment.confirmed",
      "appointment.rejected",
      "appointment.cancelled",
      "appointment.online_confirmed",
    ];

    if (syncRoutes.includes(routingKey)) {
      await upsertAppointmentRequest(payload);
      console.log(`✅ [doctor-svc] AppointmentRequest synced [${routingKey}]: ${payload.appointmentId || payload.id}`);
    }

    channel.ack(msg);
  } catch (err) {
    console.error("❌ [doctor-svc] Error processing appointment event:", err.message);
    channel.nack(msg, false, !msg.fields.redelivered);
  }
};

// ── payment.# handler ─────────────────────────────────────────────────────────
// When payment-service publishes payment.success, update paymentStatus on the
// matching AppointmentRequest so the Consultations page shows PAID correctly.
const handlePaymentEvent = async (msg) => {
  if (!msg) return;
  try {
    const payload = JSON.parse(msg.content.toString());
    const routingKey = msg.fields?.routingKey || "";

    if (routingKey === "payment.success" && payload.appointmentId) {
      const updated = await AppointmentRequest.findOneAndUpdate(
        {
          $or: [
            { mongoId: payload.appointmentId },
            { appointmentId: payload.appointmentId },
          ],
        },
        { $set: { paymentStatus: "PAID", syncedAt: new Date() } },
        { new: true }
      );

      if (updated) {
        console.log(`✅ [doctor-svc] paymentStatus → PAID for appointment ${payload.appointmentId}`);
      } else {
        console.warn(`⚠️ [doctor-svc] payment.success: no AppointmentRequest found for ${payload.appointmentId}`);
      }
    }

    channel.ack(msg);
  } catch (err) {
    console.error("❌ [doctor-svc] Error processing payment event:", err.message);
    channel.nack(msg, false, !msg.fields.redelivered);
  }
};

// ── Start consumer ────────────────────────────────────────────────────────────
export const startAppointmentConsumer = async () => {
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    connection.on("error", (err) => {
      console.error("❌ [doctor-svc] RabbitMQ error:", err.message);
      connection = null; channel = null;
      setTimeout(startAppointmentConsumer, 5000);
    });
    connection.on("close", () => {
      console.warn("⚠️ [doctor-svc] RabbitMQ closed, reconnecting...");
      connection = null; channel = null;
      setTimeout(startAppointmentConsumer, 5000);
    });

    channel = await connection.createChannel();

    // ── appointments exchange ─────────────────────────────────────────────────
    await channel.assertExchange("appointments", "topic", { durable: true });
    const aptQueue = await channel.assertQueue("doctor_service_appointments", { durable: true });
    await channel.bindQueue(aptQueue.queue, "appointments", "appointment.#");
    await channel.consume(aptQueue.queue, handleAppointmentEvent, { noAck: false });

    // ── payments exchange ─────────────────────────────────────────────────────
    await channel.assertExchange("payments", "topic", { durable: true });
    const payQueue = await channel.assertQueue("doctor_service_payments", { durable: true });
    await channel.bindQueue(payQueue.queue, "payments", "payment.#");
    await channel.consume(payQueue.queue, handlePaymentEvent, { noAck: false });

    console.log("✅ [doctor-svc] Appointment + payment event consumer started");
  } catch (err) {
    console.error("❌ [doctor-svc] Failed to start consumer:", err.message);
    setTimeout(startAppointmentConsumer, 5000);
  }
};
