const verifyInternalKey = (req, res, next) => {
  const expectedKey = process.env.INTERNAL_SERVICE_KEY;
  if (!expectedKey) {
    return next();
  }

  const incomingKey = req.headers['x-internal-service-key'];
  if (!incomingKey || incomingKey !== expectedKey) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  next();
};

module.exports = verifyInternalKey;
