import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/api/appointments`;
const DOCTOR_API = `${import.meta.env.VITE_API_URL}/api/doctors`;

// ── Token helper ──────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem('nexus_token') || localStorage.getItem('token');

// ── Search doctors via doctor-service directly ───────────────────────
export const searchDoctors = async (filters) => {
  console.log("FILTERS:", filters);
  const res = await axios.get(`${DOCTOR_API}/search`, { params: filters });
  console.log("DOCTORS FROM DOCTOR SERVICE:", res.data);
  if (Array.isArray(res.data)) return res.data;
  return res.data?.data || [];
};

// ── Get doctor slots by date ──────────────────────────────────────
export const getDoctorSlots = async (doctorId, date) => {
  const res = await axios.get(`${API}/doctor/${doctorId}/slots`, {
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

// ── Get slots for next 30 days ────────────────────────────────────
export const getDoctorSlotsNext30Days = async (doctorId) => {
  try {
    const today = new Date();
    const requests = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      requests.push(
        axios.get(`${API}/doctor/${doctorId}/slots`, {
          params: { date: dateStr }
        }).catch(() => ({ data: { physical: [], online: [] } }))
      );
    }

    const responses = await Promise.all(requests);

    const physical = [];
    const online   = [];

    responses.forEach(res => {
      if (res.data?.physical) physical.push(...res.data.physical);
      if (res.data?.online)   online.push(...res.data.online);
    });

    physical.sort((a, b) => new Date(a.date) - new Date(b.date));
    online.sort((a, b)   => new Date(a.date) - new Date(b.date));

    return { physical, online };

  } catch (error) {
    console.error("❌ ERROR fetching 30-day slots:", error.message);
    throw error;
  }
};
