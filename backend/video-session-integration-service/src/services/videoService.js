const { v4: uuidv4 } = require('uuid');
const doctorClient = require('./doctorClient');

let doctorCache = {
  data: [],
  lastUpdated: null,
};

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
    const doctors = await doctorClient.searchDoctors(query);

    if (doctors.length > 0) {
      doctorCache.data = doctors;
      doctorCache.lastUpdated = new Date().toISOString();
    }

    return {
      doctors,
      degraded: false,
      cachedAt: doctorCache.lastUpdated,
    };
  } catch (error) {
    console.error('[videoService] failed to fetch doctors from doctor-service:', error.message);

    if (doctorCache.data.length > 0) {
      return {
        doctors: doctorCache.data,
        degraded: true,
        message: 'Doctor service currently unavailable. Showing cached doctor list.',
        cachedAt: doctorCache.lastUpdated,
      };
    }

    throw error;
  }
};

const getDoctorCatalogStatus = async () => {
  try {
    const healthy = await doctorClient.checkHealth();
    return {
      doctorService: healthy ? 'ok' : 'down',
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[videoService] doctor-service health check failed:', error.message);
    return {
      doctorService: 'down',
      error: error.message,
      lastChecked: new Date().toISOString(),
    };
  }
};

module.exports = { generateNeuralLink, getDoctorsForVideo, getDoctorCatalogStatus };
