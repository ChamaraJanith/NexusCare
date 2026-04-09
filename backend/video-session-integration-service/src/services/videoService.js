const { v4: uuidv4 } = require('uuid');
const doctorClient = require('./doctorClient');
const DoctorCatalog = require('../models/DoctorCatalog');

let doctorCache = {
  data: [],
  lastUpdated: null,
};

const generateNeuralLink = async (patientId, doctorId, appointmentId = null) => {
  const safeAppointment = appointmentId ? String(appointmentId).replaceAll(/[^A-Za-z0-9_-]/g, '') : null;
  const roomId = safeAppointment
    ? `nexus-appointment-${safeAppointment}`
    : `nexus-link-${uuidv4().substring(0, 8)}`;
  const roomUrl = `https://meet.jit.si/${roomId}`;

  return {
    roomId,
    roomUrl,
    patientId,
    doctorId,
    appointmentId: safeAppointment,
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

const bootstrapDoctorCatalog = async () => {
  const doctors = await doctorClient.searchDoctors({});
  const results = await Promise.allSettled(
    doctors.map((doctor) =>
      DoctorCatalog.findOneAndUpdate(
        { doctorId: doctor.doctorId },
        {
          doctorId: doctor.doctorId,
          userId: doctor.userId || null,
          name: doctor.name || null,
          email: doctor.email || null,
          specialization: doctor.specialization || null,
          hospital: doctor.hospital || null,
          location: doctor.location || null,
          profileImage: doctor.profileImage || null,
          isActive: doctor.isActive !== false,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
    )
  );

  return results.map((result) => ({
    status: result.status,
    value: result.status === 'fulfilled' ? result.value : result.reason?.message,
  }));
};

module.exports = {
  generateNeuralLink,
  getDoctorsForVideo,
  getDoctorCatalogStatus,
  bootstrapDoctorCatalog,
};
