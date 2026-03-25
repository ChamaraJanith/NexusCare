import Joi from "joi";

export const prescriptionSchema = Joi.object({
  doctorId: Joi.string().required(),
  patientId: Joi.string().required(),
  medicines: Joi.array().items(Joi.string()).required(),
  notes: Joi.string().allow("")
});