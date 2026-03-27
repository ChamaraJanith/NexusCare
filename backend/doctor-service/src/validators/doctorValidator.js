import Joi from "joi";

// UPDATE schema (all optional, strict whitelist)
export const updateDoctorSchema = Joi.object({
  specialization: Joi.string(),
  qualifications: Joi.string(),
  experience: Joi.number().min(0),
  hospital: Joi.string(),
  location: Joi.string(),
  bio: Joi.string().allow(""),
  isActive: Joi.boolean()
}).unknown(false); // Reject unexpected fields to prevent injecting other data