const { v4: uuidv4 } = require('uuid');
const DoctorProfile = require('../models/doctorProfileModel');

const DOCTOR_DB_NAMES = (process.env.DOCTOR_DB_NAMES || 'NexusCare,test')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);
const DOCTOR_COLLECTIONS = (process.env.DOCTOR_COLLECTIONS || 'doctorprofiles,doctorprofile')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);
const USER_COLLECTIONS = (process.env.USER_COLLECTIONS || 'users,user')
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
          userId: 1,
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
        return { doctors, sourceDbName: dbName };
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
        return { doctors, sourceDbName: currentDbName };
      }
    } catch (error) {
      triedDbs.push(`${currentDbName}:error`);
    }
  }

  console.warn('[videoService] doctors not found in configured DBs:', triedDbs.join(', '));
  return { doctors: [], sourceDbName: null };
};

const getDoctorUserMapFromDatabase = async (dbName, doctors) => {
  if (!dbName || !Array.isArray(doctors) || doctors.length === 0) {
    return new Map();
  }

  const db = DoctorProfile.db.useDb(dbName, { useCache: true });
  const userIds = [...new Set(doctors.map((doctor) => doctor.userId).filter(Boolean))];
  const doctorIds = [...new Set(doctors.map((doctor) => doctor.doctorId).filter(Boolean))];

  if (userIds.length === 0 && doctorIds.length === 0) {
    return new Map();
  }

  const userMap = new Map();

  for (const collectionName of USER_COLLECTIONS) {
    const users = await db.collection(collectionName).find(
      {
        role: 'doctor',
        isActive: { $ne: false },
        $or: [
          { userId: { $in: userIds } },
          { roleId: { $in: doctorIds } }
        ]
      },
      {
        projection: {
          _id: 0,
          userId: 1,
          roleId: 1,
          name: 1,
          email: 1
        }
      }
    ).toArray();

    if (!Array.isArray(users) || users.length === 0) {
      continue;
    }

    users.forEach((user) => {
      if (user?.userId && user?.roleId) {
        userMap.set(`${user.userId}::${user.roleId}`, {
          name: user.name || user.roleId,
          email: user.email || ''
        });
      }
      if (user?.roleId) {
        userMap.set(`ROLE::${user.roleId}`, {
          name: user.name || user.roleId,
          email: user.email || ''
        });
      }
    });

    if (userMap.size > 0) {
      return userMap;
    }
  }

  return userMap;
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
  let sourceDbName = null;
  let doctorUserMap = new Map();

  try {
    const doctorData = await getDoctorsFromDatabase();
    doctors = doctorData.doctors;
    sourceDbName = doctorData.sourceDbName;
  } catch (error) {
    console.warn('[videoService] doctorprofiles DB query failed:', error.message);
  }

  try {
    doctorUserMap = await getDoctorUserMapFromDatabase(sourceDbName, doctors);
  } catch (error) {
    console.warn('[videoService] users table lookup failed:', error.message);
  }

  if (doctors.length === 0) {
    return [];
  }

  return doctors.map((doctor) => {
    const pairKey = `${doctor.userId || ''}::${doctor.doctorId || ''}`;
    const user = doctorUserMap.get(pairKey)
      || doctorUserMap.get(`ROLE::${doctor.doctorId || ''}`)
      || {};
    const displayName = user.name || doctor.doctorId;

    return {
      userId: doctor.userId || null,
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