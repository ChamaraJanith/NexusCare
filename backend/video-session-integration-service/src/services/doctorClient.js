const { createInternalApiClient } = require('./internalApiClient');

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL;
if (!DOCTOR_SERVICE_URL) {
  throw new Error('DOCTOR_SERVICE_URL must be configured for video-service');
}

const doctorApi = createInternalApiClient(DOCTOR_SERVICE_URL);

const parseDoctorSearchResponse = (response) => {
  if (Array.isArray(response.data)) {
    return response.data;
  }
  if (Array.isArray(response.data?.data)) {
    return response.data.data;
  }
  return [];
};

const buildServiceUnavailableError = (cause) => {
  const error = new Error(`Doctor service unavailable: ${cause}`);
  error.statusCode = 503;
  return error;
};

const searchDoctors = async (query = {}) => {
  try {
    const response = await doctorApi.get('/api/doctors/search', {
      params: query,
    });
    return parseDoctorSearchResponse(response);
  } catch (error) {
    const isUnavailable = error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message.includes('No response from');
    if (isUnavailable || (error.response && error.response.status >= 500)) {
      throw buildServiceUnavailableError(error.message || 'Upstream doctor-service error');
    }
    throw error;
  }
};

const checkHealth = async () => {
  try {
    const response = await doctorApi.get('/');
    return response.status === 200;
  } catch {
    return false;
  }
};

module.exports = { searchDoctors, checkHealth };
