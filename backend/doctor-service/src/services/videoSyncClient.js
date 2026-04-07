import axios from 'axios';

const VIDEO_SERVICE_URL = process.env.VIDEO_SERVICE_URL || 'http://localhost:5005';
const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY;

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  if (INTERNAL_SERVICE_KEY) {
    headers['x-internal-service-key'] = INTERNAL_SERVICE_KEY;
  }
  return headers;
};

export const syncDoctor = async (doctorPayload) => {
  try {
    await axios.post(
      `${VIDEO_SERVICE_URL}/api/video/sync/doctor`,
      doctorPayload,
      { headers: getHeaders(), timeout: 5000 }
    );
  } catch (error) {
    console.warn('[videoSyncClient] failed to sync doctor:', error.message);
  }
};

export const removeDoctor = async (doctorId) => {
  try {
    await axios.delete(
      `${VIDEO_SERVICE_URL}/api/video/sync/doctor/${encodeURIComponent(doctorId)}`,
      { headers: getHeaders(), timeout: 5000 }
    );
  } catch (error) {
    console.warn('[videoSyncClient] failed to remove doctor:', error.message);
  }
};