import axios from 'axios';

const DOCTOR_SERVICE_URL = import.meta.env?.VITE_DOCTOR_SERVICE_URL || 'http://localhost:5002';
const APPOINTMENT_SERVICE_URL = import.meta.env?.VITE_APPOINTMENT_SERVICE_URL || 'http://localhost:5003';

/**
 * Centralized axios instance for doctor-service.
 * Automatically attaches JWT from localStorage.
 */
const doctorApi = axios.create({
  baseURL: DOCTOR_SERVICE_URL,
});

doctorApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
    || localStorage.getItem('nexus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const appointmentApi = axios.create({
  baseURL: APPOINTMENT_SERVICE_URL,
});

appointmentApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
    || localStorage.getItem('nexus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Doctor Profile (aggregated: identity + professional) ────────
export const fetchDoctorProfile = async () => {
  console.log('[doctorApi] GET /api/doctors/me');
  const res = await doctorApi.get('/api/doctors/me');
  console.log('[doctorApi] /me response:', res.data);
  return res.data?.data || res.data || {};
};

// ─── Appointments ────────────────────────────────────────────────
export const fetchAppointments = async (doctorId) => {
  try {
    console.log('[doctorApi] GET /api/appointments/doctor/' + doctorId);
    const res = await appointmentApi.get(`/api/appointments/doctor/${doctorId}`);
    const data = res.data?.data || res.data?.appointments || res.data || [];
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[doctorApi] Appointments failed:', err.message);
    return [];
  }
};

// ─── Availability ────────────────────────────────────────────────
export const fetchAvailability = async (doctorId) => {
  try {
    console.log('[doctorApi] GET /api/availability/' + doctorId);
    const res = await doctorApi.get(`/api/availability/${doctorId}`);
    const data = res.data?.data || res.data || [];
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[doctorApi] Availability failed:', err.message);
    return [];
  }
};

// ─── Prescriptions ───────────────────────────────────────────────
export const fetchPrescriptions = async (doctorId) => {
  try {
    const res = await doctorApi.get(`/api/prescriptions/doctor/${doctorId}`);
    const data = res.data?.data || res.data || [];
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[doctorApi] Prescriptions failed:', err.message);
    return [];
  }
};
