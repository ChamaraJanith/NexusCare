const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const DoctorProfile = require('../models/doctorProfileModel');

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:5002';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5001';
const DOCTOR_DB_NAMES = (process.env.DOCTOR_DB_NAMES || 'NexusCare,test')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);
const DOCTOR_COLLECTIONS = (process.env.DOCTOR_COLLECTIONS || 'doctorprofiles,doctorprofile')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);

const findDoctorsInDb = async (dbName) => {
  const db = DoctorProfile.db.useDb(dbName, { useCache: true });

  for (const collectionName of DOCTOR_COLLECTIONS) {
    const doctors = await db.collection(collectionName).find(
      {
        $or: [{ isVerified: true }, { isVerified: { $exists: false } }],
        isDeleted: { $ne: true }
      },
      {
        projection: {
          _id: 0,
          doctorId: 1,
          specialty: 1,
          specialization: 1,
          hospital: 1,
          location: 1
        }
      }
    )
      .sort({ doctorId: 1 })
      .toArray();

    if (Array.isArray(doctors) && doctors.length > 0) {
      return doctors;
    }
  }

  return [];
};

const getDoctorsFromDatabase = async () => {
  const triedDbs = [];
  for (const dbName of DOCTOR_DB_NAMES) {
    try {
      const doctors = await findDoctorsInDb(dbName);
      triedDbs.push(`${dbName}:${doctors.length}`);
      if (doctors.length > 0) {
        return doctors;
      }
    } catch (error) {
      triedDbs.push(`${dbName}:error`);
    }
  }

  const currentDbName = DoctorProfile.db?.name;
  if (currentDbName && !DOCTOR_DB_NAMES.includes(currentDbName)) {
    try {
      const doctors = await findDoctorsInDb(currentDbName);
      triedDbs.push(`${currentDbName}:${doctors.length}`);
      if (doctors.length > 0) {
        return doctors;
      }
    } catch (error) {
      triedDbs.push(`${currentDbName}:error`);
    }
  }

  console.warn('[videoService] doctors not found in configured DBs:', triedDbs.join(', '));
  return [];
};

const getDoctorUserMap = async () => {
  const adminEmail = process.env.INTERNAL_ADMIN_EMAIL;
  const adminPassword = process.env.INTERNAL_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return new Map();
  }

  const loginRes = await axios.post(`${USER_SERVICE_URL}/api/auth/login`, {
    email: adminEmail,
    password: adminPassword,
  });

  const adminToken = loginRes.data?.token;
  if (!adminToken) {
    return new Map();
  }

  const usersRes = await axios.get(`${USER_SERVICE_URL}/api/admin/users`, {
    params: {
      role: 'doctor',
      page: 1,
      limit: 1000,
    },
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  const users = Array.isArray(usersRes.data?.data) ? usersRes.data.data : [];
  return new Map(
    users
      .filter((user) => user?.roleId && user?.isActive !== false)
      .map((user) => [user.roleId, {
        name: user.name || user.roleId,
        email: user.email || '',
      }])
  );
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
    timestamp: new Date()
  };
};

const getDoctorsForVideo = async () => {
  let doctors = [];
  let doctorUserMap = new Map();

  try {
    doctors = await getDoctorsFromDatabase();
  } catch (error) {
    console.warn('[videoService] direct doctor DB query failed:', error.message);
  }

  try {
    doctorUserMap = await getDoctorUserMap();
  } catch (error) {
    console.warn('[videoService] Could not load doctor users via admin API:', error.message);
  }

  if (doctors.length === 0) {
    return [];
  }

  return doctors.map((doctor) => {
    const user = doctorUserMap.get(doctor.doctorId) || {};
    const displayName = user.name || doctor.doctorId;

    return {
      doctorId: doctor.doctorId,
      name: displayName,
      label: `${displayName} (${doctor.doctorId}) - ${doctor.specialization || doctor.specialty || 'General Consultation'}`,
      specialization: doctor.specialization || doctor.specialty || null,
      hospital: doctor.hospital || null,
      location: doctor.location || null,
      email: user.email || ''
    };
  });
};

module.exports = { generateNeuralLink, getDoctorsForVideo };