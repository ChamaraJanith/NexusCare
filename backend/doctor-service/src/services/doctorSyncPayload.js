export const createDoctorSyncPayload = (doctorRecord, identity = {}) => {
  if (!doctorRecord?.doctorId) {
    return null;
  }

  return {
    doctorId: doctorRecord.doctorId,
    userId: doctorRecord.userId || null,
    name: identity.name || doctorRecord.name || `Doctor ${doctorRecord.doctorId}`,
    email: identity.email || doctorRecord.email || null,
    specialization:
      doctorRecord.specialty || doctorRecord.specialization || identity.specialization || null,
    hospital: doctorRecord.hospital || identity.hospital || null,
    location: doctorRecord.location || identity.location || null,
    profileImage: doctorRecord.profileImage || identity.profileImage || null,
    isActive: doctorRecord.isActive !== false,
  };
};
