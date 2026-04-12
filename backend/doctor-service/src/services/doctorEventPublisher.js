import { publishEvent } from './rabbitmqPublisher.js';

export const publishDoctorUpdated = async (doctorPayload) => {
  if (!doctorPayload?.doctorId) {
    throw new Error('doctorId is required to publish doctor.updated');
  }

  return publishEvent('doctors', 'doctor.updated', doctorPayload);
};

export const publishDoctorRemoved = async (doctorId) => {
  if (!doctorId) {
    throw new Error('doctorId is required to publish doctor.removed');
  }

  return publishEvent('doctors', 'doctor.removed', { doctorId });
};
