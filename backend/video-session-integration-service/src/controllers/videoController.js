const VideoSession = require('../models/videoSessionModel');
const videoService = require('../services/videoService');
const axios = require('axios');

// 1. Initialize Session
const initializeSession = async (req, res) => {
    try {
        const { patientId, doctorId, patientEmail, doctorEmail, patientPhone } = req.body;
        const sessionData = await videoService.generateNeuralLink(patientId, doctorId);

        const newSession = new VideoSession({
            roomId: sessionData.roomId,
            patientId,
            doctorId,
            // Frontend එකෙන් එවන ඊමේල් එකම ගන්න (Default එකක් ලෙස ඔයාගේ Gmail එක තැබුවා)
            patientEmail: patientEmail || "uni.chamarasweed44@gmail.com",
            doctorEmail: doctorEmail || "nexuscare.doctor@gmail.com",
            patientPhone: patientPhone || "+94767691846",
            status: 'ACTIVE'
        });

        await newSession.save();
        console.log(`✅ New Active Session Saved: ${sessionData.roomId}`);
        res.status(200).json({ success: true, data: newSession });
    } catch (error) {
        console.error("❌ Initialization Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
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

        // --- පේෂන්ට් හට ඊමේල් යැවීම ---
        if (session.patientEmail) {
            axios.post('http://localhost:5006/api/notifications/send', { 
                email: session.patientEmail, 
                ...emailPayload 
            }).then(() => console.log(`✅ Email sent to Patient: ${session.patientEmail}`))
              .catch(() => console.log("❌ Patient Email Failed"));
        }

        // --- ඩොක්ටර් හට ඊමේල් යැවීම (පේෂන්ට්ගේ ඊමේල් එකට වඩා වෙනස් නම් පමණක්) ---
        if (session.doctorEmail && session.doctorEmail !== session.patientEmail) {
            axios.post('http://localhost:5006/api/notifications/send', { 
                email: session.doctorEmail, 
                ...emailPayload 
            }).then(() => console.log(`✅ Email sent to Doctor: ${session.doctorEmail}`))
              .catch(() => console.log("❌ Doctor Email Failed"));
        }

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