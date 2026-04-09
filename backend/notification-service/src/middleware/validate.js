const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: false });
  if (error) {
    const validationError = new Error(error.details.map((detail) => detail.message).join(', '));
    validationError.statusCode = 400;
    return next(validationError);
  }
  return next();
};

module.exports = validate;
