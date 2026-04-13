import axios from "axios";
import * as cache from "./cacheService.js";
import Appointment from "../models/Appointment.js";
import AvailabilitySlot from "../models/AvailabilitySlot.js";

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

// Search for available doctors from local AvailabilitySlot database (fallback when doctor-service is down)
const searchDoctorsFromLocalSlots = async (filters) => {
  try {
    console.log("🔍 Searching doctors from local AvailabilitySlot database...");

    // Get all available slots for the specified date (or upcoming dates)
    const query = { isActive: true };

    if (filters.date) {
      query.date = filters.date;
    } else {
      // If no date specified, get slots for next 7 days
      const today = new Date();
      const next7Days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        next7Days.push(d.toISOString().split("T")[0]);
      }
      query.date = { $in: next7Days };
    }

    const slots = await AvailabilitySlot.find(query);

    if (slots.length === 0) {
      console.warn("❌ No available slots found in local database");
      return [];
    }

    // Extract unique doctors from available slots
    const doctorMap = new Map();

    for (const slot of slots) {
      const docId = slot.doctorId;
      if (!doctorMap.has(docId)) {
        doctorMap.set(docId, {
          _id: docId,
          doctorId: docId,
          name: "Unknown Doctor", // We don't have full profile, but we have hospital info
          hospital: slot.hospital,
          hospitalId: slot.hospitalId,
          consultationFee: slot.serviceFee || 3000,
          isFromLocalDatabase: true,
          availableHospitals: new Set([slot.hospital]),
        });
      } else {
        // Add hospital to the set if it's a different one
        const doctor = doctorMap.get(docId);
        if (slot.hospital && !doctor.availableHospitals.has(slot.hospital)) {
          doctor.availableHospitals.add(slot.hospital);
        }
      }
    }

    // Convert to array
    let doctors = Array.from(doctorMap.values());

    // Apply filters to the local results
    if (filters.hospital) {
      doctors = doctors.filter((d) =>
        d.availableHospitals.has(filters.hospital),
      );
    }

    // Convert Set to array for response
    doctors = doctors.map((d) => ({
      ...d,
      availableHospitals: Array.from(d.availableHospitals),
    }));

    console.log(
      `✅ Found ${doctors.length} unique doctors with available slots`,
    );
    return doctors;
  } catch (error) {
    console.error("❌ Error searching local slots:", error.message);
    return [];
  }
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
    if (cached && !cache.isExpiredStale(cacheKey)) {
      console.warn("⚠️ Serving cached doctor search results");
      return {
        data: cached,
        stale: true,
        message: "Doctor service unavailable - showing cached results.",
      };
    }

    // No fresh cache - try to search from local AvailabilitySlot database
    console.warn(
      "⚠️ Doctor service unavailable - searching from local database",
    );
    const localDoctors = await searchDoctorsFromLocalSlots(filters);

    if (localDoctors.length > 0) {
      return {
        data: localDoctors,
        stale: true,
        message:
          "Doctor service unavailable - showing doctors with available slots from local database.",
      };
    }

    return {
      data: [],
      stale: true,
      message:
        "Doctor service unavailable and no local doctors with available slots found.",
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

    return { data, stale: false, message: "" };
  } catch (error) {
    console.error("❌ ERROR fetching slots:", error.message);

    const cached = cache.get(cacheKey);
    if (cached && !cache.isExpiredStale(cacheKey)) {
      console.warn("⚠️ Serving cached slot availability from cache");
      return {
        data: cached,
        stale: true,
        message: "Doctor service unavailable - showing cached availability.",
      };
    }

    console.warn(
      "⚠️ Doctor service unavailable; using availability slots from local database",
    );

    // Convert date string to date range for proper matching with Date objects
    const selectedDate = new Date(date);
    // Ensure UTC midnight
    const year = selectedDate.getUTCFullYear();
    const month = selectedDate.getUTCMonth();
    const dateNum = selectedDate.getUTCDate();
    const startOfDay = new Date(Date.UTC(year, month, dateNum, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month, dateNum + 1, 0, 0, 0, 0));

    const slots = await AvailabilitySlot.find({
      doctorId,
      date: { $gte: startOfDay, $lt: endOfDay },
      isActive: true,
    });

    let slotData;
    if (slots.length > 0) {
      console.log(
        `✅ Found ${slots.length} availability slots in local database for ${date}`,
      );
      const physical = slots.filter((s) => s.appointmentType === "PHYSICAL");
      const online = slots.filter((s) => s.appointmentType === "ONLINE");
      slotData = {
        physical: physical.map((s) => ({
          _id: s._id,
          doctorId: s.doctorId,
          date: s.date,
          startTime: s.startTime,
          slotCount: s.slotCount,
          bookedCount: s.bookedCount,
          hospital: s.hospital,
          hospitalId: s.hospitalId,
          platform: s.platform,
          appointmentType: s.appointmentType,
          serviceFee: s.serviceFee,
        })),
        online: online.map((s) => ({
          _id: s._id,
          doctorId: s.doctorId,
          date: s.date,
          startTime: s.startTime,
          slotCount: s.slotCount,
          bookedCount: s.bookedCount,
          hospital: s.hospital,
          hospitalId: s.hospitalId,
          platform: s.platform,
          appointmentType: s.appointmentType,
          serviceFee: s.serviceFee,
        })),
      };
    } else {
      slotData = { physical: [], online: [] };
    }

    return {
      data: slotData,
      stale: true,
      message:
        "Doctor service unavailable - showing availability slots from local database.",
    };
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

    return { data, stale: false, message: "" };
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

    // Get today at midnight UTC
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const date = now.getUTCDate();
    const today = new Date(Date.UTC(year, month, date, 0, 0, 0, 0));

    // Get 3 days from now at midnight UTC
    const next3Days = new Date(Date.UTC(year, month, date + 3, 0, 0, 0, 0));

    console.log(
      `🔍 Querying slots - doctorId: ${doctorId}, date range: ${today.toISOString()} to ${next3Days.toISOString()}`,
    );

    const slots = await AvailabilitySlot.find({
      doctorId,
      date: { $gte: today, $lt: next3Days },
      isActive: true,
    });

    console.log(
      `✅ Found ${slots.length} availability slots in local database for next 3 days`,
    );

    // Debug: log first slot's date if found
    if (slots.length > 0) {
      console.log(
        `📅 First slot date: ${slots[0].date}, Type: ${typeof slots[0].date}`,
      );
    } else {
      // Debug: check what dates exist in DB
      const allSlots = await AvailabilitySlot.find({ doctorId }).select("date");
      console.log(
        `⚠️ No slots found in range. Total slots in DB for ${doctorId}: ${allSlots.length}`,
      );
      if (allSlots.length > 0) {
        console.log(
          `📅 Sample dates in DB: ${allSlots
            .slice(0, 3)
            .map((s) => s.date)
            .join(", ")}`,
        );
      }
    }

    const data = { physical: [], online: [] };
    const physical = slots.filter((s) => s.appointmentType === "PHYSICAL");
    const online = slots.filter((s) => s.appointmentType === "ONLINE");

    data.physical = physical.map((s) => ({
      _id: s._id,
      doctorId: s.doctorId,
      date: s.date,
      startTime: s.startTime,
      slotCount: s.slotCount,
      bookedCount: s.bookedCount,
      hospital: s.hospital,
      hospitalId: s.hospitalId,
      platform: s.platform,
      appointmentType: s.appointmentType,
      serviceFee: s.serviceFee,
    }));
    data.online = online.map((s) => ({
      _id: s._id,
      doctorId: s.doctorId,
      date: s.date,
      startTime: s.startTime,
      slotCount: s.slotCount,
      bookedCount: s.bookedCount,
      hospital: s.hospital,
      hospitalId: s.hospitalId,
      platform: s.platform,
      appointmentType: s.appointmentType,
      serviceFee: s.serviceFee,
    }));

    return data;
  }
};
