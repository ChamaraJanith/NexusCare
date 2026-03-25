import Joi from "joi";

export const doctorSchema = Joi.object({
  fullName: Joi.string().required(),
  specialization: Joi.string().required(),
  qualifications: Joi.string().required(),
  experience: Joi.number().min(0).required(),
  hospital: Joi.string().required(),
  bio: Joi.string().allow("")
});