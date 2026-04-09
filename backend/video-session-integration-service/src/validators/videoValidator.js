const Joi = require('joi');

const initializeSessionSchema = Joi.object({
  patientId: Joi.string().trim().required(),
  doctorId: Joi.string().trim().required(),
  appointmentId: Joi.string().trim().optional().allow(null, ''),
  patientEmail: Joi.string().trim().email().optional().allow(''),
  doctorEmail: Joi.string().trim().email().optional().allow(''),
  patientPhone: Joi.string().trim().optional().allow(''),
});

const endSessionSchema = Joi.object({
  roomId: Joi.string().trim().required(),
});

const syncDoctorSchema = Joi.object({
  doctorId: Joi.string().trim().required(),
  userId: Joi.string().trim().optional().allow(null, ''),
  name: Joi.string().trim().optional().allow(null, ''),
  email: Joi.string().trim().email().optional().allow(null, ''),
  specialization: Joi.string().trim().optional().allow(null, ''),
  hospital: Joi.string().trim().optional().allow(null, ''),
  location: Joi.string().trim().optional().allow(null, ''),
  profileImage: Joi.string().trim().optional().allow(null, ''),
  isActive: Joi.boolean().optional(),
});

const syncDoctorIdSchema = Joi.object({
  doctorId: Joi.string().trim().required(),
});

const appointmentIdSchema = Joi.object({
  appointmentId: Joi.string().trim().required(),
});

const terminateSessionSchema = Joi.object({
  roomId: Joi.string().trim().required(),
});

module.exports = {
  initializeSessionSchema,
  endSessionSchema,
  syncDoctorSchema,
  syncDoctorIdSchema,
  appointmentIdSchema,
  terminateSessionSchema,
};
