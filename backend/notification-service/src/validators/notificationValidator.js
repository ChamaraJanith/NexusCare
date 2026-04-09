const Joi = require('joi');

const sendSmsSchema = Joi.object({
  phoneNumber: Joi.string().trim().required().messages({
    'string.empty': 'phoneNumber is required',
    'any.required': 'phoneNumber is required',
  }),
  message: Joi.string().trim().min(1).required().messages({
    'string.empty': 'message is required',
    'any.required': 'message is required',
  }),
});

const sendEmailSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'email must be a valid email address',
    'any.required': 'email is required',
  }),
  subject: Joi.string().trim().min(1).required().messages({
    'string.empty': 'subject is required',
    'any.required': 'subject is required',
  }),
  message: Joi.string().trim().min(1).required().messages({
    'string.empty': 'message is required',
    'any.required': 'message is required',
  }),
});

const sendRegistrationEmailSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'email must be a valid email address',
    'any.required': 'email is required',
  }),
  name: Joi.string().trim().min(1).required().messages({
    'string.empty': 'name is required',
    'any.required': 'name is required',
  }),
  role: Joi.string().valid('doctor', 'patient').required().messages({
    'any.only': 'role must be either doctor or patient',
    'any.required': 'role is required',
  }),
});

const logNotificationSchema = Joi.object({
  type: Joi.string().valid('payment', 'appointment', 'registration', 'system', 'other').required(),
  event: Joi.string().trim().min(1).required(),
  status: Joi.string().valid('success', 'failed', 'pending', 'confirmed', 'rejected', 'cancelled').required(),
  appointmentId: Joi.string().optional(),
  paymentId: Joi.string().optional(),
  doctorId: Joi.string().optional(),
  patientId: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phoneNumber: Joi.string().trim().optional(),
  message: Joi.string().trim().optional(),
  payload: Joi.object().optional(),
});

module.exports = {
  sendSmsSchema,
  sendEmailSchema,
  sendRegistrationEmailSchema,
  logNotificationSchema,
};
