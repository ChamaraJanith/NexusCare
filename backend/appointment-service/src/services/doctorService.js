import axios from "axios";
import * as cache from "./cacheService.js";

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || "http://doctor-service:5002";

const buildSearchCacheKey = (filters) => {
  const { name = "", specialization = "", hospital = "", location = "", date = "" } = filters;
  return `doctors:${name}:${specialization}:${hospital}:${location}:${date}`;
};

const buildDoctorCacheKey = (doctorId) => `doctor:${doctorId}`;
const buildSlotCacheKey = (doctorId, date) => `availability:${doctorId}:${date}`;
const buildSlotsNextCacheKey = (doctorId) => `availability:${doctorId}:next`;

export const searchDoctors = async (filters) => {
  const cacheKey = buildSearchCacheKey(filters);

  try {
    const query = new URLSearchParams();
    if (filters.name) query.append("name", filters.name);
    if (filters.specialization) query.append("specialization", filters.specialization);
    if (filters.hospital) query.append("hospital", filters.hospital);
    if (filters.location) query.append("location", filters.location);
    if (filters.date) query.append("date", filters.date);

    const res = await axios.get(
      `${DOCTOR_SERVICE_URL}/api/doctors/search?${query.toString()}`,
      { timeout: 5000 }
    );

    const result = res.data;

    // doctor-service returns a plain array
    const doctors = Array.isArray(result) ? result : (result?.data || []);

    // Cache the fresh result and individual doctors for offline fallbacks
    if (doctors.length > 0) {
      cache.set(cacheKey, doctors, 5 * 60 * 1000);
      doctors.forEach((doctor) => {
        const id = doctor._id || doctor.id || doctor.doctorId;
        if (id) cache.set(buildDoctorCacheKey(id), doctor, 10 * 60 * 1000);
      });
    }

    return { data: doctors, stale: false, message: '' };

  } catch (error) {
    console.error("❌ ERROR CALLING DOCTOR SERVICE:", error.message);

    const cached = cache.get(cacheKey);
    if (cached) {
      console.warn("⚠️ Serving stale doctor data from cache");
      return {
        data: cached,
        stale: true,
        message: 'Doctor service unavailable - showing cached results.'
      };
    }

    console.warn("⚠️ Doctor service unavailable and no cached results available");
    return {
      data: [],
      stale: true,
      message: 'Doctor service unavailable. Please try again later.'
    };
  }
};

export const getDoctorById = async (doctorId) => {
  const cacheKey = buildDoctorCacheKey(doctorId);

  try {
    const res = await axios.get(
      `${DOCTOR_SERVICE_URL}/api/doctors/${doctorId}`,
      { timeout: 5000 }
    );

    const doctor = res.data?.data || res.data;
    if (doctor) {
      cache.set(cacheKey, doctor, 10 * 60 * 1000);
    }

    return { data: doctor, stale: false, message: '' };
  } catch (error) {
    console.error("❌ ERROR fetching doctor details:", error.message);

    const cached = cache.get(cacheKey);
    if (cached) {
      console.warn("⚠️ Serving stale doctor details from cache");
      return {
        data: cached,
        stale: true,
        message: 'Doctor service unavailable - showing cached doctor details.'
      };
    }

    return {
      data: null,
      stale: true,
      message: 'Doctor service unavailable. Please try again later.'
    };
  }
};

export const getDoctorSlots = async (doctorId, date) => {
  const cacheKey = buildSlotCacheKey(doctorId, date);

  try {
    const res = await axios.get(
      `${DOCTOR_SERVICE_URL}/api/availability/${doctorId}/by-date`,
      { params: { date }, timeout: 5000 }
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

    return { physical: [], online: [] };
  }
};

export const getDoctorSlotsNextDays = async (doctorId) => {
  const cacheKey = buildSlotsNextCacheKey(doctorId);

  try {
    const res = await axios.get(
      `${DOCTOR_SERVICE_URL}/api/availability/${doctorId}/next`,
      { timeout: 5000 }
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

    return { physical: [], online: [] };
  }
};
