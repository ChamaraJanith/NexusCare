const VideoSession = require('../models/videoSessionModel');
const videoService = require('../services/videoService');
const { publishEvent } = require('../services/eventPublisher');

const initializeSession = async (req, res, next) => {
  try {
    const { patientId, doctorId, patientEmail, doctorEmail, patientPhone, appointmentId } = req.body;
    const safeAppointmentId = appointmentId ? String(appointmentId).replaceAll(/[^A-Za-z0-9_-]/g, '') : null;

    const existingSession = safeAppointmentId
      ? await VideoSession.findOne({ appointmentId: safeAppointmentId })
      : await VideoSession.findOne({ patientId, doctorId, status: 'ACTIVE' });

    if (existingSession) {
      return res.status(200).json({
        success: true,
        data: existingSession,
        message: safeAppointmentId
          ? 'Existing appointment session retrieved'
          : 'Active session already exists',
      });
    }

    const sessionData = await videoService.generateNeuralLink(patientId, doctorId, safeAppointmentId);

    const newSession = new VideoSession({
      roomId: sessionData.roomId,
      roomUrl: sessionData.roomUrl,
      appointmentId: safeAppointmentId,
      patientId,
      doctorId,
      patientEmail: patientEmail ? String(patientEmail).trim() : '',
      doctorEmail: doctorEmail ? String(doctorEmail).trim() : '',
      patientPhone: patientPhone ? String(patientPhone).trim() : '',
      status: 'ACTIVE',
      startedAt: new Date(),
    });

    await newSession.save();

    try {
      await publishEvent('video', 'video.session.created', {
        appointmentId: newSession.appointmentId,
        roomId: newSession.roomId,
        roomUrl: newSession.roomUrl,
        patientId: newSession.patientId,
        doctorId: newSession.doctorId,
        patientEmail: newSession.patientEmail,
        doctorEmail: newSession.doctorEmail,
        patientPhone: newSession.patientPhone,
        doctorPhone: newSession.doctorPhone || '',
        appointmentType: newSession.appointmentType,
        status: newSession.status,
        startedAt: newSession.startedAt,
      });
    } catch (publishError) {
      console.warn('⚠️ Failed to publish video.session.created event:', publishError.message || publishError);
    }

    return res.status(200).json({ success: true, data: newSession });
  } catch (error) {
    next(error);
  }
};

const endSession = async (req, res, next) => {
  try {
    const { roomId } = req.body;
    const session = await VideoSession.findOne({ roomId, status: 'ACTIVE' });

    if (!session) {
      const error = new Error('Active session not found');
      error.statusCode = 404;
      throw error;
    }

    session.status = 'COMPLETED';
    session.endedAt = new Date();
    await session.save();

    try {
      await publishEvent('video', 'video.session.ended', {
        appointmentId: session.appointmentId,
        roomId: session.roomId,
        patientId: session.patientId,
        doctorId: session.doctorId,
        patientEmail: session.patientEmail,
        doctorEmail: session.doctorEmail,
        patientPhone: session.patientPhone,
        doctorPhone: session.doctorPhone || '',
        endedAt: session.endedAt,
        status: session.status,
      });
    } catch (publishError) {
      console.warn('⚠️ Failed to publish video.session.ended event:', publishError.message || publishError);
    }

    return res.status(200).json({ success: true, message: 'Video session ended', data: session });
  } catch (error) {
    next(error);
  }
};

const terminateSession = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const session = await VideoSession.findOne({ roomId, status: 'ACTIVE' });

    if (!session) {
      const error = new Error('Active session not found');
      error.statusCode = 404;
      throw error;
    }

    session.status = 'CANCELLED';
    session.endedAt = new Date();
    await session.save();

    return res.status(200).json({ success: true, message: `Session ${roomId} cancelled`, data: session });
  } catch (error) {
    next(error);
  }
};

const getSessionByAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const session = await VideoSession.findOne({ appointmentId: String(appointmentId).trim(), status: 'ACTIVE' });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Video session not found' });
    }
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const data = await VideoSession.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getDoctors = async (req, res, next) => {
  try {
    const result = await videoService.getDoctorsForVideo(req.query);
    res.status(200).json({
      success: true,
      total: result.doctors.length,
      data: result.doctors,
      degraded: result.degraded || false,
      message: result.message || null,
      cachedAt: result.cachedAt || null,
    });
  } catch (error) {
    error.statusCode = error.statusCode || error.response?.status || 503;
    next(error);
  }
};

const healthCheck = async (req, res, next) => {
  try {
    const status = await videoService.getDoctorCatalogStatus();
    res.status(200).json({
      success: true,
      service: 'video-service',
      doctorCatalog: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initializeSession,
  endSession,
  terminateSession,
  getSessionByAppointment,
  getSessions,
  getDoctors,
  healthCheck,
};
