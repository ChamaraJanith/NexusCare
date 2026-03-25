import Joi from "joi";

export const slotSchema = Joi.object({
  doctorId: Joi.string().required(),
  date: Joi.string().required(),
  startTime: Joi.string().required(),
  endTime: Joi.string().required()
});