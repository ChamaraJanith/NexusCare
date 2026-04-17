/**
 * Startup Backfill
 *
 * Re-publishes all existing Appointment records as appointment.created events
 * on startup. Keeps downstream read-replicas (doctor-service, payment-service)
 * fully in sync including queueNumber and all other fields.
 */

import Appointment from "../models/Appointment.js";
import { publishEvent } from "../services/eventPublisher.js";

const buildPayload = (appt) => ({
  appointmentId:      appt.appointmentId,
  id:                 appt._id?.toString(),
  patientId:          appt.patientId,
  doctorId:           appt.doctorId,
  appointmentType:    appt.appointmentType,
  status:             appt.status,
  paymentStatus:      appt.paymentStatus,
  date:               appt.date,
  time:               appt.time,
  patientEmail:       appt.email,
  patientPhone:       appt.phone,
  doctorEmail:        appt.doctorEmail || null,
  queueNumber:        appt.queueNumber ?? null,
  doctorName:         appt.doctorName,
  doctorHospital:     appt.doctorHospital || "",
  hospitalId:         appt.hospitalId || "",
  doctorProfileImage: appt.doctorProfileImage || "",
  patientName:        appt.patientName,
  rejectionReason:    appt.rejectionReason || null,
  charges:            appt.charges || null,
});

export const runStartupBackfill = async () => {
  // Wait for RabbitMQ channel to be ready
  await new Promise((r) => setTimeout(r, 3000));

  const appointments = await Appointment.find({}).lean();
  if (appointments.length === 0) {
    console.log("ℹ️ Startup backfill: no appointments to publish");
    return;
  }

  let published = 0;
  let failed = 0;

  for (const appt of appointments) {
    try {
      await publishEvent("appointments", "appointment.created", buildPayload(appt));
      published++;
    } catch (e) {
      failed++;
      console.warn(`⚠️ Backfill failed for ${appt.appointmentId}:`, e.message);
    }
  }

  console.log(`✅ Startup backfill: ${published}/${appointments.length} published, ${failed} failed`);
};
