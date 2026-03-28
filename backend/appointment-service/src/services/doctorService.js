import axios from "axios";

export const searchDoctors = async (filters) => {
  try {
    const query = new URLSearchParams();

    if (filters.specialty) query.append("specialty", filters.specialty);
    if (filters.hospital) query.append("hospital", filters.hospital);
    if (filters.date) query.append("date", filters.date);

    const res = await axios.get(
      `http://localhost:5002/api/doctors?${query.toString()}`
    );

    console.log("🔥 DOCTOR SERVICE RESPONSE:", res.data);

    // ✅ FINAL FIX
    return res.data;

  } catch (error) {
    console.error("❌ ERROR CALLING DOCTOR SERVICE:", error.message);
    return [];
  }
};

// 🔥 FIXED VERSION

export const getDoctorSlots = async (doctorId, date) => {
  try {
    const res = await axios.get(
      `http://localhost:5002/api/availability/${doctorId}/by-date?date=${date}`
    );

    return res.data;

  } catch (error) {
    console.error("❌ ERROR fetching slots:", error.message);
    throw error;
  }
};