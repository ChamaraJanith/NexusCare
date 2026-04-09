const VideoSession = require('../models/videoSessionModel');
const videoService = require('../services/videoService');
const notificationClient = require('../services/notificationClient');

// 1. Initialize Session
const initializeSession = async (req, res) => {
    try {
        const { patientId, doctorId, patientEmail, doctorEmail, patientPhone } = req.body;

        if (!patientId || !doctorId) {
            return res.status(400).json({ success: false, message: 'patientId and doctorId are required' });
        }

        const resolvedPatientEmail = patientEmail ? String(patientEmail).trim() : '';
        const resolvedDoctorEmail = doctorEmail ? String(doctorEmail).trim() : '';

        const existingActiveSession = await VideoSession.findOne({ patientId, doctorId, status: 'ACTIVE' });
        if (existingActiveSession) {
            return res.status(200).json({ success: true, data: existingActiveSession, message: 'Active session already exists' });
        }

        const sessionData = await videoService.generateNeuralLink(patientId, doctorId);

        const newSession = new VideoSession({
            roomId: sessionData.roomId,
            patientId,
            doctorId,
            patientEmail: resolvedPatientEmail,
            doctorEmail: resolvedDoctorEmail,
            patientPhone: patientPhone ? String(patientPhone).trim() : '+94767691846',
            status: 'ACTIVE'
        });

        await newSession.save();

        const startMessage = `Your NexusCare session (Room: ${sessionData.roomId}) has started.`;
        const uniqueRecipients = [...new Set([resolvedPatientEmail, resolvedDoctorEmail].filter(Boolean))];

        await Promise.all(uniqueRecipients.map(async (toEmail) => {
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
        }));

        res.status(200).json({ success: true, data: newSession });
    } catch (error) {
        console.error('❌ Initialization Error:', error);
        next(error);
    }
};

// 2. End Session & Trigger Notifications
const endSession = async (req, res) => {
    try {
        const { roomId } = req.body;
        const session = await VideoSession.findOne({ roomId, status: 'ACTIVE' });

        if (!session) {
            return res.status(404).json({ success: false, message: 'Active session not found' });
        }

        session.status = 'COMPLETED';
        session.updatedAt = new Date();
        await session.save();

        console.log(`🏁 Session ${roomId} marked as COMPLETED in DB`);

        const emailPayload = {
            subject: 'Consultation Summary - NexusCare',
            message: `Your medical session (Room: ${roomId}) has ended successfully. Thank you for using NexusCare.`
        };

        const uniqueRecipients = [...new Set([session.patientEmail, session.doctorEmail].filter(Boolean))];

        await Promise.all(uniqueRecipients.map(async (toEmail) => {
            try {
                await notificationClient.sendEmail({
                  email: toEmail,
                  subject: 'Consultation Summary - NexusCare',
                  message: emailPayload.message,
                });
                console.log(`✅ Email sent to: ${toEmail}`);
            } catch (sendErr) {
                console.warn(`⚠️ Failed Email to: ${toEmail}`, sendErr.message);
            }
        }));

        if (session.patientPhone) {
            console.log(`📱 Triggering SMS for: ${session.patientPhone}`);
            notificationClient.sendSms({
                phoneNumber: session.patientPhone,
                message: `NexusCare: Your session (Room: ${roomId}) is complete.`,
            })
              .then(() => console.log('✅ SMS Request successfully sent'))
              .catch(e => console.log('❌ SMS Request Failed:', e.response ? e.response.data : e.message));
        }

        res.status(200).json({ success: true, message: 'Notifications Dispatched' });
    } catch (error) {
        console.error('❌ End Session Error:', error.message);
        next(error);
    }
};

// 3. Get All Sessions
const getSessions = async (req, res, next) => {
    try {
        const data = await VideoSession.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// 3.5. Sync a doctor record from doctor-service into video service
const syncDoctor = async (req, res, next) => {
    try {
        const doctorPayload = req.body;
        console.log('🔁 Received doctor sync request', { doctorId: doctorPayload?.doctorId });

        // In this implementation, video service accepts the synced doctor payload.
        // A real implementation would persist or reconcile this data as needed.
        res.status(200).json({ success: true, message: 'Doctor sync received', data: doctorPayload });
    } catch (error) {
        console.error('❌ Sync Doctor Error:', error.message);
        next(error);
    }
};

const removeDoctor = async (req, res, next) => {
    try {
        const { doctorId } = req.params;
        if (!doctorId) {
            const error = new Error('doctorId is required');
            error.statusCode = 400;
            return next(error);
        }

        console.log('🗑️ Received doctor removal request for', doctorId);
        res.status(200).json({ success: true, message: `Doctor ${doctorId} removed from video sync` });
    } catch (error) {
        console.error('❌ Remove Doctor Error:', error.message);
        next(error);
    }
};

// 4. Doctors List for Patient Video Booking
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
        console.error('❌ Get Doctors Error:', error.message, error.response?.data || '');
        error.statusCode = error.statusCode || error.response?.status || 503;
        next(error);
    }
};
// 5. Health check for video service and doctor catalog
const healthCheck = async (req, res, next) => {
    try {
        const status = await videoService.getDoctorCatalogStatus();
        res.status(200).json({
            success: true,
            service: 'video-service',
            doctorCatalog: status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Health Check Error:', error.message);
        next(error);
    }
};

module.exports = { initializeSession, endSession, getSessions, syncDoctor, removeDoctor, getDoctors, healthCheck };