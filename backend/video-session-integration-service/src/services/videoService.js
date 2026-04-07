const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:5002';
let cachedDoctors = [];

const generateNeuralLink = async (patientId, doctorId) => {
  const roomId = `nexus-link-${uuidv4().substring(0, 8)}`;
  const roomUrl = `https://meet.jit.si/${roomId}`;

  return {
    roomId,
    roomUrl,
    patientId,
    doctorId,
    status: 'ACTIVE',
    timestamp: new Date(),
  };
};

const getDoctorsForVideo = async (query = {}) => {
  try {
    const response = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors/search`, {
      params: query,
      timeout: 5000,
    });

    let data;

    if (Array.isArray(response.data)) {
      data = response.data;
    } else if (Array.isArray(response.data?.data)) {
      data = response.data.data;
    } else {
      data = [];
    }

    if (data.length > 0) {
      cachedDoctors = data;
    }

    return data.length > 0 ? data : cachedDoctors;
  } catch (error) {
    console.error('[videoService] failed to fetch doctors from doctor-service:', error.message);
    return cachedDoctors;
  }
};

module.exports = { generateNeuralLink, getDoctorsForVideo };
