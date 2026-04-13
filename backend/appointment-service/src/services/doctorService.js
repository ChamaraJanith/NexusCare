import axios from "axios";
import * as cache from "./cacheService.js";
import Appointment from "../models/Appointment.js";
import AvailabilitySlot from "../models/AvailabilitySlot.js";
import DoctorSnapshot from "../models/DoctorSnapshot.js";

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
      // Enrich with DoctorSnapshot profile data
      const doctorIds = localDoctors.map((d) => d.doctorId || d._id);
      const snapshots = await DoctorSnapshot.find({ doctorId: { $in: doctorIds } }).lean();
      const snapshotMap = {};
      snapshots.forEach((s) => { snapshotMap[s.doctorId] = s; });

      const enriched = localDoctors.map((d) => {
        const id = d.doctorId || d._id;
        const snap = snapshotMap[id];
        if (!snap) return d;
        return {
          ...d,
          name: snap.name || d.name,
          specialization: snap.specialization || d.specialization,
          specialty: snap.specialization || d.specialization,
          hospital: snap.hospital || d.hospital,
          profileImage: snap.profileImage || d.profileImage,
          consultationFee: snap.consultationFee || d.consultationFee,
        };
      });

      return {
        data: enriched,
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
      // Keep local snapshot fresh whenever we get a live response
      DoctorSnapshot.findOneAndUpdate(
        { doctorId },
        {
          $set: {
            doctorId,
            name: doctor.name || "",
            email: doctor.email || null,
            specialization: doctor.specialization || doctor.specialty || "",
            hospital: doctor.hospital || "",
            location: doctor.location || "",
            profileImage: doctor.profileImage || null,
            consultationFee: Number(doctor.consultationFee || doctor.fee || 0),
            isActive: doctor.isActive !== false,
            syncedAt: new Date(),
          },
        },
        { upsert: true }
      ).catch(() => {}); // fire-and-forget, non-critical
    }

    return { data: doctor, stale: false, message: "" };
  } catch (error) {
    console.error("❌ ERROR fetching doctor details:", error.message);

    // 1. Try in-memory cache first (fastest)
    const cached = cache.get(cacheKey);
    if (cached) {
      console.warn("⚠️ Serving stale doctor details from cache");
      return {
        data: cached,
        stale: true,
        message: "Doctor service unavailable - showing cached doctor details.",
      };
    }

    // 2. Fall back to local DoctorSnapshot (persisted across restarts)
    const snapshot = await DoctorSnapshot.findOne({ doctorId }).lean();
    if (snapshot) {
      console.warn("⚠️ Serving doctor profile from local snapshot");
      const snapshotData = {
        _id: snapshot.doctorId,
        doctorId: snapshot.doctorId,
        name: snapshot.name,
        email: snapshot.email,
        specialization: snapshot.specialization,
        specialty: snapshot.specialization,
        hospital: snapshot.hospital,
        location: snapshot.location,
        profileImage: snapshot.profileImage,
        consultationFee: snapshot.consultationFee,
        isActive: snapshot.isActive,
      };
      cache.set(cacheKey, snapshotData, 5 * 60 * 1000);
      return {
        data: snapshotData,
        stale: true,
        message: "Doctor service unavailable - showing last known doctor profile.",
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

    // Query by exact YYYY-MM-DD string — matches the String date field in AvailabilitySlot
    const slots = await AvailabilitySlot.find({
      doctorId,
      date: date, // exact string match e.g. "2026-04-14"
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
      cache.set(cacheKey, { data, stale: false, message: "" }, 5 * 60 * 1000);
    }

    return { data, stale: false, message: "" };
  } catch (error) {
    console.error("❌ ERROR fetching upcoming slots:", error.message);

    const cached = cache.get(cacheKey);
    if (cached) {
      console.warn("⚠️ Serving stale upcoming availability from cache");
      // Ensure consistent { data, stale, message } envelope
      if (cached.stale !== undefined) return cached;
      return { data: cached, stale: true, message: "Showing cached availability." };
    }

    console.warn(
      "⚠️ Doctor service unavailable; using fallback upcoming availability",
    );

    // Build YYYY-MM-DD string range — matches the String date field in AvailabilitySlot
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const future = new Date(now);
    future.setDate(future.getDate() + 30);
    const futureStr = future.toISOString().split("T")[0];

    console.log(
      `🔍 Querying slots - doctorId: ${doctorId}, date range: ${todayStr} to ${futureStr}`,
    );

    const slots = await AvailabilitySlot.find({
      doctorId,
      date: { $gte: todayStr, $lte: futureStr },
      isActive: true,
    }).sort({ date: 1, startTime: 1 });

    console.log(
      `✅ Found ${slots.length} availability slots in local database for next 30 days`,
    );

    if (slots.length === 0) {
      const allSlots = await AvailabilitySlot.find({ doctorId }).select("date").limit(3);
      console.log(
        `⚠️ No slots in range. Sample dates in DB: ${allSlots.map((s) => s.date).join(", ")}`,
      );
    }

    const physical = slots.filter((s) => s.appointmentType === "PHYSICAL");
    const online = slots.filter((s) => s.appointmentType === "ONLINE");

    const mapSlot = (s) => ({
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
    });

    return {
      data: { physical: physical.map(mapSlot), online: online.map(mapSlot) },
      stale: true,
      message: "Doctor service unavailable - showing availability from local database.",
    };
  }
};
