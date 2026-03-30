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

// Attach JWT token from localStorage to every doctor-service request
doctorApi.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('nexus_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('[doctorApi] No auth token found in localStorage');
  }

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
  const res = await doctorApi.get('/api/doctors/me');
  return res.data?.data || res.data;
};

/**
 * Update MS2-owned professional fields.
 * Specialization is editable and stored in MS2.
 */
export const updateDoctorProfileData = async (payload) => {
  const { specialization, experience, hospital, location, bio } = payload;
  const res = await doctorApi.put('/api/doctors/me', { specialization, experience, hospital, location, bio });
  return res.data?.data;
};

export const uploadDoctorImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  // The interceptor already attaches the token; no need to force it manually
  const res = await doctorApi.post('/api/doctors/me/image', formData);

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

export const fetchAvailabilityByDate = async (doctorId, date) => {
  try {
    const res = await doctorApi.get(`/api/availability/${doctorId}/by-date`, { params: { date } });
    
    // Support either { data: [...] } or { data: { physical: [...], online: [...] } }
    let data = res.data?.data || res.data || [];
    
    if (!Array.isArray(data)) {
        // if the API returns { physical: [], online: [] } instead of flat array
        const physical = Array.isArray(data.physical) ? data.physical : [];
        const online = Array.isArray(data.online) ? data.online : [];
        data = [...physical, ...online];
    }

    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[doctorApi] Availability by date failed:', err.message);
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