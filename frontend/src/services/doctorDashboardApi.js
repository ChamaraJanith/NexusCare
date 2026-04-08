import axios from 'axios';

// Define base URLs explicitly (can be overridden by environment variables)
const DOCTOR_SERVICE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const APPOINTMENT_SERVICE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Helper to retrieve Authorization headers.
 * Checks both 'token' and 'nexus_token' keys for compatibility.
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
    || sessionStorage.getItem('token')
    || localStorage.getItem('nexus_token')
    || sessionStorage.getItem('nexus_token');

  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

/**
 * Fetch the aggregated doctor profile from the NEW /api/doctors/me endpoint.
 * This single call returns: name, email, profileImage, specialization, hospital, etc.
 */
export const fetchDoctorProfile = async () => {
  const headers = getAuthHeaders();
  console.log('[API] Calling GET /api/doctors/me');

  const response = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors/me`, headers);
  console.log('[API] /api/doctors/me response:', response.data);

  // Response shape: { success: true, data: { doctorId, name, email, profileImage, ... } }
  return response.data?.data || response.data || {};
};

/**
 * Fetch appointments for a doctor.
 */
export const fetchDoctorAppointments = async (doctorId) => {
  const headers = getAuthHeaders();
  console.log('[API] Calling GET /api/appointments/doctor/' + doctorId);

  try {
    const response = await axios.get(
      `${APPOINTMENT_SERVICE_URL}/api/appointments/doctor/${doctorId}`,
      headers
    );
    console.log('[API] Appointments response:', response.data);

    const data = response.data?.data || response.data?.appointments || response.data || [];
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[API] Appointments fetch failed:', err.message);
    return [];
  }
};

/**
 * Fetch availability slots for a doctor.
 */
export const fetchDoctorAvailability = async (doctorId) => {
  const headers = getAuthHeaders();

  try {
    const response = await axios.get(
      `${DOCTOR_SERVICE_URL}/api/availability/${doctorId}`,
      headers
    );
    const data = response.data?.data || response.data || [];
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[API] Availability fetch failed:', err.message);
    return [];
  }
};

/**
 * Aggregates all dashboard data using Promise.all.
 * Uses the new /api/doctors/me for profile + identity in a single call.
 */
export const fetchDoctorDashboardData = async (doctorId) => {
  const [profile, appointments, availability] = await Promise.all([
    fetchDoctorProfile(),
    fetchDoctorAppointments(doctorId),
    fetchDoctorAvailability(doctorId),
  ]);

  return {
    success: true,
    identity: {
      name: profile.name,
      email: profile.email,
      profileImage: profile.profileImage,
      phone: profile.phone,
    },
    professional: {
      specialization: profile.specialization,
      qualifications: profile.qualifications,
      experience: profile.experience,
      hospital: profile.hospital,
      location: profile.location,
      bio: profile.bio,
    },
    appointments,
    availability,
  };
};
