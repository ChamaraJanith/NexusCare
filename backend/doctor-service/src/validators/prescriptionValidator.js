import Joi from "joi";

export const prescriptionSchema = Joi.object({
  doctorId: Joi.string().optional(),
  doctorName: Joi.string().optional(),
  patientId: Joi.string().required(),
  appointmentId: Joi.string().optional(),
  diagnosis: Joi.string().required(),
  symptoms: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional().allow(""),
  medicines: Joi.array().items(
    Joi.alternatives().try(
      Joi.string(),
      Joi.object({
        name: Joi.string().required(),
        dosage: Joi.string().allow("").optional(),
        frequency: Joi.string().allow("").optional(),
        duration: Joi.string().allow("").optional(),
        instructions: Joi.string().allow("").optional()
      })
    )
  ).required(),
  advice: Joi.string().allow("").optional(),
  followUpDate: Joi.date().allow(null, "").optional(),
  notes: Joi.string().allow("").optional()
});