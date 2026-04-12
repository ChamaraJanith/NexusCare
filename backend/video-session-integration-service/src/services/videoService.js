const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const doctorClient = require('./doctorClient');
const DoctorCatalog = require('../models/DoctorCatalog');

let doctorCache = {
  data: [],
  lastUpdated: null,
};

/**
 * Generates a short-lived Jitsi JWT for a specific user and room.
 * The frontend appends this as ?jwt=<token> to the Jitsi room URL.
 * Jitsi validates it before granting access.
 *
 * Requires JITSI_APP_ID and JITSI_APP_SECRET in .env.
 * Falls back gracefully if not configured (open rooms).
 */
const generateJitsiToken = (userId, displayName, roomId, role = 'participant') => {
  const appId = process.env.JITSI_APP_ID;
  const appSecret = process.env.JITSI_APP_SECRET;

  if (!appId || !appSecret) {
    // Not configured — return null, room stays open (dev mode)
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: appId,
    sub: 'meet.jit.si',
    aud: appId,
    room: roomId,
    iat: now,
    exp: now + 60 * 60, // 1 hour
    context: {
      user: {
        id: String(userId),
        name: displayName || String(userId),
        moderator: role === 'moderator',
      },
    },
  };

  return jwt.sign(payload, appSecret);
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

const upsertDoctorCatalog = async (doctorPayload) => {
  if (!doctorPayload?.doctorId) {
    throw new Error('doctorId is required to upsert doctor catalog');
  }

  return DoctorCatalog.findOneAndUpdate(
    { doctorId: doctorPayload.doctorId },
    {
      doctorId: doctorPayload.doctorId,
      userId: doctorPayload.userId || null,
      name: doctorPayload.name || doctorPayload.doctorId || `Doctor ${doctorPayload.doctorId}`,
      email: doctorPayload.email || null,
      specialization: doctorPayload.specialization || doctorPayload.specialty || null,
      hospital: doctorPayload.hospital || null,
      location: doctorPayload.location || null,
      profileImage: doctorPayload.profileImage || null,
      isActive: doctorPayload.isActive !== false,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

const removeDoctorFromCatalog = async (doctorId) => {
  if (!doctorId) {
    throw new Error('doctorId is required to remove doctor from catalog');
  }

  return DoctorCatalog.deleteOne({ doctorId });
};

module.exports = {
  generateNeuralLink,
  generateJitsiToken,
  getDoctorsForVideo,
  getDoctorCatalogStatus,
  bootstrapDoctorCatalog,
  upsertDoctorCatalog,
  removeDoctorFromCatalog,
};
