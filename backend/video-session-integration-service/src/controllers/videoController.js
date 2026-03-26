const VideoSession = require('../models/videoSessionModel');
const videoService = require('../services/videoService');
const axios = require('axios');
const User = require('../../../user-patient-service/src/models/User');

// 1. Initialize Session
const initializeSession = async (req, res) => {
    try {
        const { patientId, doctorId, patientEmail, doctorEmail, patientPhone } = req.body;

        if (!patientId || !doctorId) {
            return res.status(400).json({ success: false, message: 'patientId and doctorId are required' });
        }

        let resolvedPatientEmail = patientEmail ? String(patientEmail).trim() : '';
        let resolvedDoctorEmail = doctorEmail ? String(doctorEmail).trim() : '';

        if (!resolvedPatientEmail) {
            const patientUser = await User.findOne({ roleId: patientId.trim() });
            if (!patientUser || !patientUser.email) {
                return res.status(404).json({ success: false, message: 'Patient email not found' });
            }
            resolvedPatientEmail = patientUser.email;
        }

        if (!resolvedDoctorEmail) {
            const doctorUser = await User.findOne({ roleId: doctorId.trim() });
            if (!doctorUser || !doctorUser.email) {
                return res.status(404).json({ success: false, message: 'Doctor email not found' });
            }
            resolvedDoctorEmail = doctorUser.email;
        }

        // Avoid double notifications for duplicates
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

        const uniqueRecipients = [...new Set([resolvedPatientEmail, resolvedDoctorEmail])];
        await Promise.all(uniqueRecipients.map(async (toEmail) => {
            try {
                await axios.post('http://localhost:5006/api/notifications/send', {
                    email: toEmail,
                    subject: 'NexusCare Consultation Started',
                    message: startMessage
                });
                console.log(`✅ Email sent to ${toEmail}`);
            } catch (sendErr) {
                console.warn(`⚠️ Email failed to ${toEmail}:`, sendErr.message);
            }
        }));

        res.status(200).json({ success: true, data: newSession });
    } catch (error) {
        console.error('❌ Initialization Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
};

// 2. End Session & Trigger Notifications
const endSession = async (req, res) => {
    try {
        const { roomId } = req.body;
        // මුලින්ම සෙෂන් එක Active ද බලනවා
        const session = await VideoSession.findOne({ roomId, status: 'ACTIVE' });

        if (!session) {
            return res.status(404).json({ message: "Active session not found" });
        }

        // DB එකේ status එක update කරනවා (දෙපාරක් notifications යෑම වැළැක්වීමට මෙය වැදගත්)
        session.status = 'COMPLETED';
        session.updatedAt = new Date();
        await session.save();

        console.log(`🏁 Session ${roomId} marked as COMPLETED in DB`);

        // Notification Payload
        const emailPayload = {
            subject: "Consultation Summary - NexusCare",
            message: `Your medical session (Room: ${roomId}) has ended successfully. Thank you for using NexusCare.`
        };

        const uniqueRecipients = [...new Set([session.patientEmail, session.doctorEmail].filter(Boolean))];

        await Promise.all(uniqueRecipients.map(async (toEmail) => {
            try {
                await axios.post('http://localhost:5006/api/notifications/send', {
                    email: toEmail,
                    ...emailPayload
                });
                console.log(`✅ Email sent to: ${toEmail}`);
            } catch (sendErr) {
                console.warn(`⚠️ Failed Email to: ${toEmail}`, sendErr.message);
            }
        }));

        // --- SMS යැවීම ---
        if (session.patientPhone) {
            console.log(`📱 Triggering SMS for: ${session.patientPhone}`);
            axios.post('http://localhost:5006/api/notifications/send-sms', {
                phoneNumber: session.patientPhone,
                message: `NexusCare: Your session (Room: ${roomId}) is complete.`
            }).then(() => console.log("✅ SMS Request successfully sent"))
              .catch(e => console.log("❌ SMS Request Failed:", e.response ? e.response.data : e.message));
        }

        res.status(200).json({ success: true, message: "Notifications Dispatched" });
    } catch (error) {
        console.error("❌ End Session Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 3. Get All Sessions
const getSessions = async (req, res) => {
    try {
        const data = await VideoSession.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { initializeSession, endSession, getSessions };