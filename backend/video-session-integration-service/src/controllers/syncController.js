const DoctorCatalog = require('../models/DoctorCatalog');
const videoService = require('../services/videoService');

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

const upsertDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.body;

    if (!doctorId) {
      const error = new Error('doctorId is required');
      error.statusCode = 400;
      throw error;
    }

    const payload = {
      doctorId,
      userId: req.body.userId || null,
      name: req.body.name || req.body.doctorId || `Doctor ${doctorId}`,
      email: req.body.email || null,
      specialization: req.body.specialization || null,
      hospital: req.body.hospital || null,
      location: req.body.location || null,
      profileImage: req.body.profileImage || null,
      isActive: req.body.isActive !== false,
    };

    const doctor = await DoctorCatalog.findOneAndUpdate(
      { doctorId },
      { $set: payload },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
};

const removeDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    if (!doctorId) {
      const error = new Error('doctorId is required');
      error.statusCode = 400;
      throw error;
    }

    await DoctorCatalog.deleteOne({ doctorId });
    return res.status(200).json({ success: true, message: 'Doctor removed from local catalog' });
  } catch (error) {
    next(error);
  }
};

const bootstrapDoctorCatalog = async (req, res, next) => {
  try {
    const doctors = await videoService.bootstrapDoctorCatalog();
    return res.status(200).json({ success: true, data: doctors });
  } catch (error) {
    next(error);
  }
};

module.exports = { verifyInternalKey, upsertDoctor, removeDoctor, bootstrapDoctorCatalog };
