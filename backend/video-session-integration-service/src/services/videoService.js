const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const DoctorCatalog = require('../models/DoctorCatalog');

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:5002';

const sanitizeDoctorRecord = (doctor) => {
  const doctorId = doctor?.doctorId || null;
  const name = doctor?.name || doctor?.doctorId || `Doctor ${doctorId}`;
  const specialization = doctor?.specialization || doctor?.specialty || null;

  return {
    doctorId,
    userId: doctor?.userId || null,
    name,
    email: doctor?.email || null,
    specialization,
    hospital: doctor?.hospital || null,
    location: doctor?.location || null,
    profileImage: doctor?.profileImage || null,
    isActive: doctor?.isActive !== false,
  };
};

let lastBootstrapStatus = {
  success: null,
  timestamp: null,
  error: null,
  count: 0,
};

const upsertDoctorCatalog = async (doctor) => {
  if (!doctor?.doctorId) return null;

  const payload = sanitizeDoctorRecord(doctor);

  return await DoctorCatalog.findOneAndUpdate(
    { doctorId: payload.doctorId },
    { $set: payload },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

const fetchDoctorsFromDoctorService = async () => {
  try {
    const response = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors/search`, {
      timeout: 5000,
    });

    const data = Array.isArray(response.data)
      ? response.data
      : response.data?.data;

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('[videoService] failed to fetch doctors from doctor-service:', error.message);
    return [];
  }
};

let bootstrapInProgress = false;

const bootstrapDoctorCatalog = async () => {
  if (bootstrapInProgress) {
    return [];
  }

  bootstrapInProgress = true;
  try {
    const remoteDoctors = await fetchDoctorsFromDoctorService();
    if (!Array.isArray(remoteDoctors) || remoteDoctors.length === 0) {
      lastBootstrapStatus = {
        success: false,
        timestamp: new Date().toISOString(),
        error: 'No doctors returned from doctor-service',
        count: 0,
      };
      return [];
    }

    await Promise.all(remoteDoctors.map(upsertDoctorCatalog));
    lastBootstrapStatus = {
      success: true,
      timestamp: new Date().toISOString(),
      error: null,
      count: remoteDoctors.length,
    };
    return remoteDoctors;
  } catch (error) {
    lastBootstrapStatus = {
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message,
      count: 0,
    };
    return [];
  } finally {
    bootstrapInProgress = false;
  }
};

const scheduleDoctorCatalogBootstrap = (intervalMs = 60000) => {
  setInterval(async () => {
    const count = await DoctorCatalog.countDocuments();
    if (count === 0) {
      console.log('[videoService] empty catalog, retrying bootstrap from doctor-service');
      await bootstrapDoctorCatalog();
    }
  }, intervalMs);
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

const getDoctorsForVideo = async () => {
  let doctors = await DoctorCatalog.find({ isActive: true }).sort({ doctorId: 1 }).lean();

  if (!Array.isArray(doctors) || doctors.length === 0) {
    await bootstrapDoctorCatalog();
    doctors = await DoctorCatalog.find({ isActive: true }).sort({ doctorId: 1 }).lean();
  }

  return doctors.map((doctor) => {
    const doctorName = doctor.name || `Doctor ${doctor.doctorId}`;
    return {
      doctorId: doctor.doctorId,
      userId: doctor.userId,
      name: doctorName,
      label: `${doctorName} (${doctor.doctorId}) - ${doctor.specialization || 'General Consultation'}`,
      specialization: doctor.specialization,
      hospital: doctor.hospital,
      location: doctor.location,
      email: doctor.email || '',
      profileImage: doctor.profileImage || null,
    };
  });
};

const getDoctorCatalogStatus = async () => {
  const count = await DoctorCatalog.countDocuments();
  return {
    count,
    lastBootstrap: lastBootstrapStatus,
  };
};

module.exports = { generateNeuralLink, getDoctorsForVideo, bootstrapDoctorCatalog, scheduleDoctorCatalogBootstrap, getDoctorCatalogStatus };
