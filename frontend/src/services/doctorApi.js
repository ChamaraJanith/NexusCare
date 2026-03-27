import axios from 'axios';

const DOCTOR_SERVICE_URL =
  import.meta.env?.VITE_DOCTOR_SERVICE_URL || 'http://localhost:5002';

const APPOINTMENT_SERVICE_URL =
  import.meta.env?.VITE_APPOINTMENT_SERVICE_URL || 'http://localhost:5003';

/**
 * Doctor Service Axios Instance
 */
const doctorApi = axios.create({
  baseURL: DOCTOR_SERVICE_URL,
});

// 🔥 REQUEST INTERCEPTOR WITH DEBUG
doctorApi.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('nexus_token');

  console.log("🔐 TOKEN DEBUG:", token); // 👈 DEBUG

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("⚠️ No token found in localStorage");
  }

  console.log("📡 REQUEST:", config.method?.toUpperCase(), config.url);
  console.log("📨 HEADERS:", config.headers); // 👈 DEBUG

  return config;
});

/**
 * Appointment Service Axios Instance
 */
const appointmentApi = axios.create({
  baseURL: APPOINTMENT_SERVICE_URL,
});

appointmentApi.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('nexus_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ───────────────────────────────────────────────
// 👨‍⚕️ Doctor Profile
// ───────────────────────────────────────────────

export const fetchDoctorProfile = async () => {
  console.log('[doctorApi] GET /api/doctors/me');

  const res = await doctorApi.get('/api/doctors/me');

  console.log('[doctorApi] /me response:', res.data);

  return res.data?.data || res.data || {};
};

export const updateDoctorProfileData = async (payload) => {
  const res = await doctorApi.put('/api/doctors/me', payload);
  return res.data?.data;
};

// 🔥 FIXED IMAGE UPLOAD (FORCE TOKEN)
export const uploadDoctorImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('nexus_token');

  console.log("🖼️ Uploading image...");
  console.log("🔐 TOKEN USED:", token);

  const res = await doctorApi.post(
    '/api/doctors/me/image',
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`, // 🔥 FORCE HEADER
      },
    }
  );

  console.log("✅ Upload response:", res.data);

  return res.data?.data;
};

// ───────────────────────────────────────────────
// 📅 Appointments
// ───────────────────────────────────────────────

export const fetchAppointments = async (doctorId) => {
  try {
    console.log('[doctorApi] GET /api/appointments/doctor/' + doctorId);

    const res = await appointmentApi.get(
      `/api/appointments/doctor/${doctorId}`
    );

    const data =
      res.data?.data || res.data?.appointments || res.data || [];

    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[doctorApi] Appointments failed:', err.message);
    return [];
  }
};

// ───────────────────────────────────────────────
// ⏱️ Availability
// ───────────────────────────────────────────────

export const fetchAvailability = async (doctorId) => {
  try {
    const res = await doctorApi.get(`/api/availability/${doctorId}`);

    const data = res.data?.data || res.data || [];

    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[doctorApi] Availability failed:', err.message);
    return [];
  }
};

export const createAvailabilitySlot = async (payload) => {
  const res = await doctorApi.post('/api/availability', payload);
  return res.data?.data;
};

export const updateAvailabilitySlot = async (slotId, payload) => {
  const res = await doctorApi.put(
    `/api/availability/${slotId}`,
    payload
  );
  return res.data?.data;
};

export const deleteAvailabilitySlot = async (slotId) => {
  const res = await doctorApi.delete(
    `/api/availability/${slotId}`
  );
  return res.data;
};

// ───────────────────────────────────────────────
// 💊 Prescriptions
// ───────────────────────────────────────────────

export const fetchPrescriptions = async (doctorId) => {
  try {
    const res = await doctorApi.get(
      `/api/prescriptions/doctor/${doctorId}`
    );

    const data = res.data?.data || res.data || [];

    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[doctorApi] Prescriptions failed:', err.message);
    return [];
  }
};