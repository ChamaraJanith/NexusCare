const VideoSession = require('../models/videoSessionModel');
const videoService = require('../services/videoService');
const notificationClient = require('../services/notificationClient');

const initializeSession = async (req, res, next) => {
  try {
    const { patientId, doctorId, patientEmail, doctorEmail, patientPhone, appointmentId } = req.body;
    const safeAppointmentId = appointmentId ? String(appointmentId).replaceAll(/[^A-Za-z0-9_-]/g, '') : null;

    const existingActiveSession = safeAppointmentId
      ? await VideoSession.findOne({ appointmentId: safeAppointmentId, status: 'ACTIVE' })
      : await VideoSession.findOne({ patientId, doctorId, status: 'ACTIVE' });

    if (existingActiveSession) {
      return res.status(200).json({
        success: true,
        data: existingActiveSession,
        message: 'Active session already exists',
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

    const startMessage = `Your NexusCare session (Room: ${sessionData.roomId}) has started.`;
    const uniqueRecipients = [...new Set([newSession.patientEmail, newSession.doctorEmail].filter(Boolean))];

    const emailTasks = uniqueRecipients.map(async (toEmail) => {
      try {
        await notificationClient.sendEmail({
          email: toEmail,
          subject: 'NexusCare Consultation Started',
          message: startMessage,
        });
        console.log(`✅ Email sent to ${toEmail}`);
      } catch (sendErr) {
        console.warn(`⚠️ Email failed to ${toEmail}:`, sendErr.message);
      }
    });

    await Promise.allSettled(emailTasks);

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

    const emailPayload = {
      subject: 'Consultation Summary - NexusCare',
      message: `Your medical session (Room: ${roomId}) has ended successfully. Thank you for using NexusCare.`,
    };

    const uniqueRecipients = [...new Set([session.patientEmail, session.doctorEmail].filter(Boolean))];
    const emailTasks = uniqueRecipients.map(async (toEmail) => {
      try {
        await notificationClient.sendEmail({
          email: toEmail,
          subject: emailPayload.subject,
          message: emailPayload.message,
        });
        console.log(`✅ Email sent to: ${toEmail}`);
      } catch (sendErr) {
        console.warn(`⚠️ Failed Email to: ${toEmail}`, sendErr.message);
      }
    });

    await Promise.allSettled(emailTasks);

    if (session.patientPhone) {
      try {
        await notificationClient.sendSms({
          phoneNumber: session.patientPhone,
          message: `NexusCare: Your session (Room: ${roomId}) is complete.`,
        });
        console.log('✅ SMS Request successfully sent');
      } catch (e) {
        console.log('❌ SMS Request Failed:', e.response ? e.response.data : e.message);
      }
    }

    return res.status(200).json({ success: true, message: 'Notifications Dispatched', data: session });
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
