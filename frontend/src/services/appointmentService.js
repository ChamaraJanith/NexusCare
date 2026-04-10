import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/api/appointments`;
const DOCTOR_API = `${import.meta.env.VITE_API_URL}/api/doctors`;
const AVAILABILITY_API = `${import.meta.env.VITE_API_URL}/api/availability`;

// ── Token helper ──────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem('nexus_token') || localStorage.getItem('token');

export const getDoctorDetails = async (doctorId) => {
  try {
    const res = await axios.get(`${DOCTOR_API}/internal/${doctorId}`);
    return res.data?.data || null;
  } catch (error) {
    console.warn('⚠️ Failed to fetch doctor details:', error.message);
    return null;
  }
};

// ── Search doctors via doctor-service directly ───────────────────────
export const searchDoctors = async (filters) => {
  console.log("FILTERS:", filters);
  const res = await axios.get(`${DOCTOR_API}/search`, { params: filters });
  console.log("DOCTORS FROM DOCTOR SERVICE:", res.data);
  if (Array.isArray(res.data)) return res.data;
  return res.data?.data || [];
};

// ── Get doctor slots by date ───────────────────────────────────────
export const getDoctorSlots = async (doctorId, date) => {
  const res = await axios.get(`${AVAILABILITY_API}/${doctorId}/by-date`, {
    params: { date }
  });
  return res.data;
};

// ── Get next queue number ─────────────────────────────────────────
export const getNextQueueNumber = async (doctorId, date) => {
  const res = await axios.get(`${API}/queue/next`, {
    params: { doctorId, date }
  });
  return res.data;
};

// ── Book appointment (token required) ────────────────────────────
export const bookAppointment = async (data) => {
  const res = await axios.post(API, data, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  return res.data;
};

// ── Get patient appointments (token required) ─────────────────────
export const getMyAppointments = async (patientId) => {
  const res = await axios.get(`${API}/patient/${patientId}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  return Array.isArray(res.data) ? res.data : (res.data.appointments || []);
};

// ── Cancel appointment (token required) ───────────────────────────
export const cancelAppointment = async (id) => {
  const res = await axios.delete(`${API}/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  return res.data;
};

// ── Get all availability for a doctor ─────────────────────────────
export const getDoctorSlotsNext30Days = async (doctorId) => {
  try {
    const res = await axios.get(`${AVAILABILITY_API}/${doctorId}/next`);
    const payload = res.data;
    const data = payload?.data ?? payload;

    return {
      physical: Array.isArray(data.physical) ? data.physical : [],
      online: Array.isArray(data.online) ? data.online : []
    };
  } catch (error) {
    console.error("❌ ERROR fetching doctor availability:", error.message);
    throw error;
  }
};
