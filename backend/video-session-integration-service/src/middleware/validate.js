const validate = (schema, source = 'body') => (req, res, next) => {
  const data = req[source];
  const { error } = schema.validate(data, { abortEarly: false, allowUnknown: false });

  if (error) {
    const validationError = new Error(error.details.map((detail) => detail.message).join(', '));
    validationError.statusCode = 400;
    return next(validationError);
  }

  return next();
};

module.exports = validate;
