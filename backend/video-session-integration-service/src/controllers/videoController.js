const VideoSession = require("../models/videoSessionModel");
const videoService = require("../services/videoService");
const { publishEvent } = require("../services/eventPublisher");

const initializeSession = async (req, res, next) => {
  try {
    const {
      patientId,
      doctorId,
      patientEmail,
      doctorEmail,
      patientPhone,
      appointmentId,
    } = req.body;
    const safeAppointmentId = appointmentId
      ? String(appointmentId).replaceAll(/[^A-Za-z0-9_-]/g, "")
      : null;
    const requestingUserId = req.user?.id;
    const requestingUserRole = req.user?.role;

    const existingSession = safeAppointmentId
      ? await VideoSession.findOne({ appointmentId: safeAppointmentId })
      : await VideoSession.findOne({ patientId, doctorId, status: "ACTIVE" });

    if (existingSession) {
      const jitsiToken = videoService.generateJitsiToken(
        requestingUserId,
        requestingUserRole,
        existingSession.roomId,
        requestingUserRole === "doctor" ? "moderator" : "participant",
      );

      return res.status(200).json({
        success: true,
        data: existingSession,
        jitsiToken,
        roomUrl: jitsiToken
          ? `${existingSession.roomUrl}?jwt=${jitsiToken}`
          : existingSession.roomUrl,
        message: safeAppointmentId
          ? "Existing appointment session retrieved"
          : "Active session already exists",
      });
    }

    const sessionData = await videoService.generateNeuralLink(
      patientId,
      doctorId,
      safeAppointmentId,
    );

    const newSession = new VideoSession({
      roomId: sessionData.roomId,
      roomUrl: sessionData.roomUrl,
      appointmentId: safeAppointmentId,
      patientId,
      doctorId,
      patientEmail: patientEmail ? String(patientEmail).trim() : "",
      doctorEmail: doctorEmail ? String(doctorEmail).trim() : "",
      patientPhone: patientPhone ? String(patientPhone).trim() : "",
      status: "ACTIVE",
      startedAt: new Date(),
    });

    await newSession.save();
    const jitsiToken = videoService.generateJitsiToken(
      requestingUserId,
      requestingUserRole,
      newSession.roomId,
      requestingUserRole === "doctor" ? "moderator" : "participant",
    );

    try {
      await publishEvent("video", "video.session.created", {
        appointmentId: newSession.appointmentId,
        roomId: newSession.roomId,
        roomUrl: newSession.roomUrl,
        patientId: newSession.patientId,
        doctorId: newSession.doctorId,
        patientEmail: newSession.patientEmail,
        doctorEmail: newSession.doctorEmail,
        patientPhone: newSession.patientPhone,
        doctorPhone: newSession.doctorPhone || "",
        appointmentType: newSession.appointmentType,
        status: newSession.status,
        startedAt: newSession.startedAt,
      });
    } catch (publishError) {
      console.warn(
        "⚠️ Failed to publish video.session.created event:",
        publishError.message || publishError,
      );
    }

    return res.status(200).json({
      success: true,
      data: newSession,
      jitsiToken,
      roomUrl: jitsiToken
        ? `${newSession.roomUrl}?jwt=${jitsiToken}`
        : newSession.roomUrl,
    });
  } catch (error) {
    next(error);
  }
};

const endSession = async (req, res, next) => {
  try {
    const { roomId } = req.body;
    const session = await VideoSession.findOne({ roomId, status: "ACTIVE" });

    if (!session) {
      const error = new Error("Active session not found");
      error.statusCode = 404;
      throw error;
    }

    session.status = "COMPLETED";
    session.endedAt = new Date();
    await session.save();

    try {
      await publishEvent("video", "video.session.ended", {
        appointmentId: session.appointmentId,
        roomId: session.roomId,
        patientId: session.patientId,
        doctorId: session.doctorId,
        patientEmail: session.patientEmail,
        doctorEmail: session.doctorEmail,
        patientPhone: session.patientPhone,
        doctorPhone: session.doctorPhone || "",
        endedAt: session.endedAt,
        status: session.status,
      });
    } catch (publishError) {
      console.warn(
        "⚠️ Failed to publish video.session.ended event:",
        publishError.message || publishError,
      );
    }

    return res
      .status(200)
      .json({ success: true, message: "Video session ended", data: session });
  } catch (error) {
    next(error);
  }
};

const terminateSession = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const session = await VideoSession.findOne({ roomId, status: "ACTIVE" });

    if (!session) {
      const error = new Error("Active session not found");
      error.statusCode = 404;
      throw error;
    }

    session.status = "CANCELLED";
    session.endedAt = new Date();
    await session.save();

    return res.status(200).json({
      success: true,
      message: `Session ${roomId} cancelled`,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

const getSessionByAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const session = await VideoSession.findOne({
      appointmentId: String(appointmentId).trim(),
      status: "ACTIVE",
    });
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Video session not found" });
    }
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.user?.role === "doctor") {
      filter.doctorId = req.user.roleId || req.user.id;
    } else if (req.user?.role === "patient") {
      filter.patientId = req.user.roleId || req.user.id;
    }

    const [data, total] = await Promise.all([
      VideoSession.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      VideoSession.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data,
    });
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
      service: "video-service",
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
