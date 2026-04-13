import axios from "axios";
import * as cache from "./cacheService.js";
import Appointment from "../models/Appointment.js";

const DOCTOR_SERVICE_URL =
  process.env.DOCTOR_SERVICE_URL || "http://doctor-service:5002";

const buildSearchCacheKey = (filters) => {
  const {
    name = "",
    specialization = "",
    hospital = "",
    location = "",
    date = "",
  } = filters;
  return `doctors:${name}:${specialization}:${hospital}:${location}:${date}`;
};

const buildDoctorCacheKey = (doctorId) => `doctor:${doctorId}`;
const buildSlotCacheKey = (doctorId, date) =>
  `availability:${doctorId}:${date}`;
const buildSlotsNextCacheKey = (doctorId) => `availability:${doctorId}:next`;

const buildFallbackSlot = ({
  doctorId,
  date,
  startTime,
  type,
  hospital,
  hospitalId,
  platform,
}) => ({
  _id: `fallback:${doctorId}:${date}:${startTime}:${type}`,
  doctorId,
  date,
  startTime,
  slotCount: 20,
  bookedCount: 0,
  hospital: hospital || (type === "ONLINE" ? "Telemedicine" : "Hospital"),
  hospitalId: hospitalId || null,
  platform: platform || (type === "ONLINE" ? "Zoom" : undefined),
  appointmentType: type,
  serviceFee: 0,
});

const buildFallbackSlotsForDate = (doctorId, date) => {
  return {
    physical: [
      buildFallbackSlot({
        doctorId,
        date,
        startTime: "09:00",
        type: "PHYSICAL",
        hospital: "Fallback Hospital",
        platform: undefined,
      }),
    ],
    online: [
      buildFallbackSlot({
        doctorId,
        date,
        startTime: "14:00",
        type: "ONLINE",
        hospital: "Telemedicine",
        platform: "Zoom",
      }),
    ],
  };
};

const buildFallbackSlotsFromAppointments = (doctorId, appointments) => {
  const byType = { physical: new Map(), online: new Map() };

  for (const appointment of appointments) {
    const type =
      appointment.appointmentType === "PHYSICAL" ? "physical" : "online";
    const key = `${appointment.date}|${appointment.time}|${type}|${appointment.doctorHospital || appointment.hospital || "fallback"}`;

    if (!byType[type].has(key)) {
      byType[type].set(key, {
        _id: `fallback:${doctorId}:${appointment.date}:${appointment.time}:${type}`,
        doctorId,
        date: appointment.date,
        startTime: appointment.time,
        slotCount: 20,
        bookedCount: 0,
        hospital:
          appointment.doctorHospital ||
          appointment.hospital ||
          (type === "ONLINE" ? "Telemedicine" : "Hospital"),
        hospitalId: appointment.hospitalId || null,
        platform: type === "online" ? "Zoom" : undefined,
        appointmentType: type === "PHYSICAL" ? "PHYSICAL" : "ONLINE",
        serviceFee: 0,
      });
    }

    byType[type].get(key).bookedCount += 1;
  }

  return {
    physical: Array.from(byType.physical.values()),
    online: Array.from(byType.online.values()),
  };
};

export const searchDoctors = async (filters) => {
  const cacheKey = buildSearchCacheKey(filters);

  try {
    const query = new URLSearchParams();
    if (filters.name) query.append("name", filters.name);
    if (filters.specialization)
      query.append("specialization", filters.specialization);
    if (filters.hospital) query.append("hospital", filters.hospital);
    if (filters.location) query.append("location", filters.location);
    if (filters.date) query.append("date", filters.date);

    const res = await axios.get(
      `${DOCTOR_SERVICE_URL}/api/doctors/search?${query.toString()}`,
      { timeout: 5000 },
    );

    const result = res.data;

    // doctor-service returns a plain array
    const doctors = Array.isArray(result) ? result : result?.data || [];

    // Cache the fresh result and individual doctors for offline fallbacks
    if (doctors.length > 0) {
      cache.set(cacheKey, doctors, 5 * 60 * 1000);
      doctors.forEach((doctor) => {
        const id = doctor._id || doctor.id || doctor.doctorId;
        if (id) cache.set(buildDoctorCacheKey(id), doctor, 10 * 60 * 1000);
      });
    }

    return { data: doctors, stale: false, message: "" };
  } catch (error) {
    console.error("❌ ERROR CALLING DOCTOR SERVICE:", error.message);

    const cached = cache.get(cacheKey);
    if (cached) {
      console.warn("⚠️ Serving stale doctor data from cache");
      return {
        data: cached,
        stale: true,
        message: "Doctor service unavailable - showing cached results.",
      };
    }

    console.warn(
      "⚠️ Doctor service unavailable and no cached results available",
    );
    return {
      data: [],
      stale: true,
      message: "Doctor service unavailable. Please try again later.",
    };
  }
};

export const getDoctorById = async (doctorId) => {
  const cacheKey = buildDoctorCacheKey(doctorId);

  try {
    const res = await axios.get(
      `${DOCTOR_SERVICE_URL}/api/doctors/${doctorId}`,
      { timeout: 5000 },
    );

    const doctor = res.data?.data || res.data;
    if (doctor) {
      cache.set(cacheKey, doctor, 10 * 60 * 1000);
    }

    return { data: doctor, stale: false, message: "" };
  } catch (error) {
    console.error("❌ ERROR fetching doctor details:", error.message);

    const cached = cache.get(cacheKey);
    if (cached) {
      console.warn("⚠️ Serving stale doctor details from cache");
      return {
        data: cached,
        stale: true,
        message: "Doctor service unavailable - showing cached doctor details.",
      };
    }

    return {
      data: null,
      stale: true,
      message: "Doctor service unavailable. Please try again later.",
    };
  }
};

export const getDoctorSlots = async (doctorId, date) => {
  const cacheKey = buildSlotCacheKey(doctorId, date);

  try {
    const res = await axios.get(
      `${DOCTOR_SERVICE_URL}/api/availability/${doctorId}/by-date`,
      { params: { date }, timeout: 5000 },
    );

    const data = res.data;
    if (data) {
      cache.set(cacheKey, data, 5 * 60 * 1000);
    }

    return data;
  } catch (error) {
    console.error("❌ ERROR fetching slots:", error.message);

    const cached = cache.get(cacheKey);
    if (cached) {
      console.warn("⚠️ Serving stale slot availability from cache");
      return cached;
    }

    console.warn(
      "⚠️ Doctor service unavailable; using fallback local availability",
    );
    const appointments = await Appointment.find({ doctorId, date });
    if (appointments.length > 0) {
      return buildFallbackSlotsFromAppointments(doctorId, appointments);
    }

    return buildFallbackSlotsForDate(doctorId, date);
  }
};

export const getDoctorSlotsNextDays = async (doctorId) => {
  const cacheKey = buildSlotsNextCacheKey(doctorId);

  try {
    const res = await axios.get(
      `${DOCTOR_SERVICE_URL}/api/availability/${doctorId}/next`,
      { timeout: 5000 },
    );

    const data = res.data;
    if (data) {
      cache.set(cacheKey, data, 5 * 60 * 1000);
    }

    return data;
  } catch (error) {
    console.error("❌ ERROR fetching upcoming slots:", error.message);

    const cached = cache.get(cacheKey);
    if (cached) {
      console.warn("⚠️ Serving stale upcoming availability from cache");
      return cached;
    }

    console.warn(
      "⚠️ Doctor service unavailable; using fallback upcoming availability",
    );
    const today = new Date();
    const next3Days = [0, 1, 2].map((offset) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      return d.toISOString().split("T")[0];
    });

    const appointments = await Appointment.find({
      doctorId,
      date: { $in: next3Days },
    });

    const data = { physical: [], online: [] };
    next3Days.forEach((date) => {
      const dayAppointments = appointments.filter((apt) => apt.date === date);
      if (dayAppointments.length > 0) {
        const slots = buildFallbackSlotsFromAppointments(
          doctorId,
          dayAppointments,
        );
        data.physical.push(...slots.physical);
        data.online.push(...slots.online);
      } else {
        const fallback = buildFallbackSlotsForDate(doctorId, date);
        data.physical.push(...fallback.physical);
        data.online.push(...fallback.online);
      }
    });

    return data;
  }
};
