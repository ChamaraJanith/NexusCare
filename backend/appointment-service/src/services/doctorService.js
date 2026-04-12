import axios from "axios";
import * as cache from "./cacheService.js";

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || "http://doctor-service:5002";

const buildCacheKey = (filters) => {
  const { name = "", specialization = "", hospital = "", location = "", date = "" } = filters;
  return `doctors:${name}:${specialization}:${hospital}:${location}:${date}`;
};

export const searchDoctors = async (filters) => {
  const cacheKey = buildCacheKey(filters);

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

    // Cache the fresh result
    if (doctors.length > 0) {
      cache.set(cacheKey, doctors);
    }

    return { data: doctors, stale: false, message: '' };

  } catch (error) {
    console.error("❌ ERROR CALLING DOCTOR SERVICE:", error.message);

    // Serve from cache if available (stale-while-revalidate pattern)
    const cached = cache.get(cacheKey);
    if (cached) {
      console.warn("⚠️ Serving stale doctor data from cache");
      return {
        data: cached,
        stale: true,
        message: 'Doctor service unavailable - showing cached results.'
      };
    }

    // No cache — service is down, return safe empty response rather than failing hard
    console.warn("⚠️ Doctor service unavailable and no cached results available");
    return {
      data: [],
      stale: true,
      message: 'Doctor service unavailable. Please try again later.'
    };
  }
};

export const getDoctorSlots = async (doctorId, date) => {
  try {
    const res = await axios.get(
      `${DOCTOR_SERVICE_URL}/api/availability/${doctorId}/by-date?date=${date}`,
      { timeout: 5000 }
    );
    return res.data;
  } catch (error) {
    console.error("❌ ERROR fetching slots:", error.message);
    throw error;
  }
};
