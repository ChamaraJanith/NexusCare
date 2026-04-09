import axios from "axios";

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || "http://doctor-service:5002";

export const searchDoctors = async (filters) => {
  try {
    const query = new URLSearchParams();

    if (filters.name) query.append("name", filters.name);
    if (filters.specialization) query.append("specialization", filters.specialization);
    if (filters.hospital) query.append("hospital", filters.hospital);
    if (filters.location) query.append("location", filters.location);
    if (filters.date) query.append("date", filters.date);

    const res = await axios.get(
      `${DOCTOR_SERVICE_URL}/api/doctors/search?${query.toString()}`
    );

    console.log("🔥 DOCTOR SERVICE RESPONSE:", res.data);

    // ✅ FINAL FIX: The backend will return { data: [...] }
    return res.data;

  } catch (error) {
    console.error("❌ ERROR CALLING DOCTOR SERVICE:", error.message);
    return { data: [] }; // returning an empty payload structure mimicking res.data
  }
};

// 🔥 FIXED VERSION

export const getDoctorSlots = async (doctorId, date) => {
  try {
    const res = await axios.get(
      `${DOCTOR_SERVICE_URL}/api/availability/${doctorId}/by-date?date=${date}`
    );

    return res.data;

  } catch (error) {
    console.error("❌ ERROR fetching slots:", error.message);
    throw error;
  }
};