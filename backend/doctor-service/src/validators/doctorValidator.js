import Joi from "joi";

export const doctorSchema = Joi.object({
  fullName: Joi.string().required(),
  specialization: Joi.string().required(),
  qualifications: Joi.string().required(),
  experience: Joi.number().min(0).required(),
  hospital: Joi.string().required(),
  location: Joi.string().required(), 
  bio: Joi.string().allow("")
});

// UPDATE schema (all optional)
export const updateDoctorSchema = Joi.object({
  fullName: Joi.string(),
  specialization: Joi.string(),
  qualifications: Joi.string(),
  experience: Joi.number().min(0),
  hospital: Joi.string(),
  location: Joi.string(),
  bio: Joi.string().allow("")
});