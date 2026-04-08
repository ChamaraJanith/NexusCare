import api from './api';

const MS1_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Fetch the authenticated patient's profile directly from the backend.
 * This is used to get the phone number which is not included in the login response.
 * @returns {Promise<Object>} The patient profile data
 */
export const getPatientProfile = async () => {
  try {
    const res = await api.get(`${MS1_URL}/api/patient/profile`);
    return res.data;
  } catch (error) {
    console.error("❌ ERROR fetching patient profile:", error.message);
    throw error;
  }
};
