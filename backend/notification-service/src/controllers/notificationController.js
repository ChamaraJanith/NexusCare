const twilio = require('twilio');
const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');
const config = require('../config/config');

// --- Twilio Configuration ---
const twilioClient = new twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
const twilioNumber = config.TWILIO_PHONE_NUMBER;
const twilioMessagingServiceSid = config.TWILIO_MESSAGING_SERVICE_SID;

// --- Notify.lk configuration ---
const notifyLKUserId = config.NOTIFYLK_USER_ID;
const notifyLKApiKey = config.NOTIFYLK_API_KEY;
const notifyLKsenderId = config.NOTIFYLK_SENDER_ID || 'NEXUSCARE';

// Provider selection
const SMS_PROVIDER = config.SMS_PROVIDER;

/**
 * 1. Send SMS Function
 */
const sendSMSViaTwilio = async (phoneNumber, message) => {
    const opts = {
        body: message,
        to: phoneNumber
    };

    if (twilioMessagingServiceSid) {
        opts.messagingServiceSid = twilioMessagingServiceSid;
    } else {
        opts.from = twilioNumber;
    }

    return twilioClient.messages.create(opts);
};

const sendSMSViaNotifyLK = async (phoneNumber, message) => {
    if (!notifyLKUserId || !notifyLKApiKey) {
        throw new Error('NOTIFYLK_USER_ID and NOTIFYLK_API_KEY must be set');
    }

    // notify.lk requires 11-digit mobile format without '+' for 'to'.
    let to11 = phoneNumber.replace(/^\+/, '');
    if (/^0\d{9}$/.test(to11)) {
        to11 = '94' + to11.slice(1);
    }
    if (!/^\d{11}$/.test(to11)) {
        throw new Error('notify.lk requires 11-digit Sri Lankan number (e.g. 947XXXXXXXX)');
    }

    const bodyVariants = [
        new URLSearchParams({
            userId: notifyLKUserId,
            apiKey: notifyLKApiKey,
            senderId: notifyLKsenderId || 'NotifyDEMO',
            to: to11,
            message,
        }).toString(),
        new URLSearchParams({
            user_id: notifyLKUserId,
            api_key: notifyLKApiKey,
            sender_id: notifyLKsenderId || 'NotifyDEMO',
            to: to11,
            message,
        }).toString(),
    ];

    let lastError = null;

    // 1) Attempt POST in both parameter styles
    for (const formBody of bodyVariants) {
        try {
            const url = new URL('/api/v1/send', config.NOTIFYLK_BASE_URL);
            console.log('notify.lk POST request to', url.toString(), 'body', formBody);
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formBody,
            });

            const data = await response.json();
            console.log('notify.lk POST response', response.status, data);

            if (response.ok && data.status === 'success') {
                return data;
            }

            lastError = new Error(`notify.lk POST error: ${JSON.stringify(data)}`);
            if (data && Array.isArray(data.errors) && data.errors.length) {
                console.warn('notify.lk POST returned errors, will try other variant/fallback', data.errors);
                continue;
            }

            break;
        } catch (err) {
            lastError = err;
            console.warn('notify.lk POST attempt failed', err.message || err);
            if (err.cause && err.cause.code === 'ENOTFOUND') {
                break; // cannot resolve base URL, don't continue
            }
        }
    }

    // 2) Fallback GET with both param styles (if POST failed non-DNS)
    for (const queryString of [
        new URLSearchParams({
            userId: notifyLKUserId,
            apiKey: notifyLKApiKey,
            senderId: notifyLKsenderId || 'NotifyDEMO',
            to: to11,
            message,
        }).toString(),
        new URLSearchParams({
            user_id: notifyLKUserId,
            api_key: notifyLKApiKey,
            sender_id: notifyLKsenderId || 'NotifyDEMO',
            to: to11,
            message,
        }).toString(),
    ]) {
        try {
            const url = `${config.NOTIFYLK_BASE_URL}/api/v1/send?${queryString}`;
            console.log('notify.lk GET fallback request to', url);
            const response = await fetch(url, { method: 'GET' });
            const data = await response.json();
            console.log('notify.lk GET response', response.status, data);

            if (response.ok && data.status === 'success') {
                return data;
            }

            lastError = new Error(`notify.lk GET error: ${JSON.stringify(data)}`);
            continue;
        } catch (err) {
            lastError = err;
            console.warn('notify.lk GET attempt failed', err.message || err);
            if (err.cause && err.cause.code === 'ENOTFOUND') {
                break;
            }
        }
    }

    throw lastError || new Error('notify.lk SMS send failed');
};

const normalizePhoneNumber = (number) => {
    if (!number || typeof number !== 'string') return null;

    // strip spaces/hyphens etc
    const cleaned = number.replace(/[\s-()]/g, '');

    // already E.164
    if (/^\+\d{10,15}$/.test(cleaned)) return cleaned;

    // Sri Lanka local: 0XXXXXXXXX -> +94XXXXXXXXX
    if (/^0\d{9}$/.test(cleaned)) {
        return '+94' + cleaned.slice(1);
    }

    // maybe no leading + or 0, assume country code
    if (/^\d{10,15}$/.test(cleaned)) {
        return '+' + cleaned;
    }

    return null;
};

const sendSMSPayload = async ({ phoneNumber, message }) => {
    const normalized = normalizePhoneNumber(phoneNumber);
    if (!normalized) {
        throw new Error('Invalid phone number format. Use +947xxxxxxx or 07xxxxxxx.');
    }

    if (SMS_PROVIDER === 'notifylk') {
        const result = await sendSMSViaNotifyLK(normalized, message);
        console.log(`✅ notify.lk SMS sent to ${normalized}`, result);
        return result;
    }

    const result = await sendSMSViaTwilio(normalized, message);
    console.log(`✅ Twilio SMS sent to ${normalized}`, result.sid);
    return result;
};

const sendSMS = async (req, res, next) => {
    try {
        const { phoneNumber, message } = req.body;
        const result = await sendSMSPayload({ phoneNumber, message });
        return res.status(200).json({ success: true, provider: SMS_PROVIDER, result });
    } catch (error) {
        error.statusCode = error.statusCode || 500;
        next(error);
    }
};

const sendRegistrationEmailPayload = async ({ email, name, role }) => {
    const displayRole = role === 'doctor' ? 'Doctor' : 'Patient';
    const subject = `Welcome to NexusCare, ${displayRole}!`;
    const message = `Hello ${name},\n\n` +
        `Your ${displayRole.toLowerCase()} account has been created successfully on NexusCare.\n` +
        `You can now login and use the platform.\n\n` +
        `Best regards,\nNexusCare Team`;

    const transporter = getEmailTransporter();
    return transporter.sendMail({
        from: `"NexusCare" <${config.GMAIL_USER}>`,
        to: email,
        subject,
        text: message,
    });
};

const sendEmailPayload = async ({ email, subject, message }) => {
    const transporter = getEmailTransporter();
    return transporter.sendMail({
        from: `"NexusCare" <${config.GMAIL_USER}>`,
        to: email,
        subject,
        text: message,
    });
};

const buildAppointmentNotificationMessages = (payload, routingKey) => {
    const appointmentLabel = payload.appointmentType === 'ONLINE' ? 'online appointment' : 'appointment';
    const displayDate = payload.date || 'your scheduled date';
    const displayTime = payload.time || 'your scheduled time';
    const patientName = payload.patientName || 'Patient';
    const doctorName = payload.doctorName || 'Doctor';

    switch (routingKey) {
        case 'appointment.created':
            return {
                subject: `Appointment Booked with ${doctorName}`,
                message: `Hello ${patientName},\n\nYour ${appointmentLabel} with Dr. ${doctorName} has been created for ${displayDate} at ${displayTime}.\n\nWe will notify you when it is confirmed.\n\nThank you,\nNexusCare Team`,
                sms: `Your appointment with Dr. ${doctorName} is booked for ${displayDate} at ${displayTime}.`,
            };
        case 'appointment.confirmed':
            return {
                subject: `Appointment Confirmed with ${doctorName}`,
                message: `Hello ${patientName},\n\nYour ${appointmentLabel} with Dr. ${doctorName} has been confirmed for ${displayDate} at ${displayTime}.\n\nThank you,\nNexusCare Team`,
                sms: `Your appointment with Dr. ${doctorName} is confirmed for ${displayDate} at ${displayTime}.`,
            };
        case 'appointment.rejected':
            return {
                subject: `Appointment Rejected`,
                message: `Hello ${patientName},\n\nYour ${appointmentLabel} scheduled for ${displayDate} at ${displayTime} has been rejected.\n\nPlease book another appointment or contact NexusCare support.\n\nThank you,\nNexusCare Team`,
                sms: `Your appointment scheduled for ${displayDate} at ${displayTime} has been rejected. Please reschedule.`,
            };
        default:
            return null;
    }
};

const processAppointmentNotificationEvent = async (payload, routingKey) => {
    const notification = buildAppointmentNotificationMessages(payload, routingKey);
    if (!notification) {
        throw new Error(`Unsupported routing key: ${routingKey}`);
    }

    const promises = [];
    if (payload.email) {
        promises.push(sendEmailPayload({ email: payload.email, subject: notification.subject, message: notification.message }));
    }
    if (payload.phone) {
        promises.push(sendSMSPayload({ phoneNumber: payload.phone, message: notification.sms }));
    }

    const results = await Promise.allSettled(promises);
    const errors = results.filter((result) => result.status === 'rejected').map((result) => result.reason);
    if (errors.length) {
        throw new Error(`Appointment notification failed: ${errors.map((err) => err.message || err).join('; ')}`);
    }

    await saveNotificationRecord({
        type: 'appointment',
        event: routingKey,
        status: 'sent',
        appointmentId: payload.appointmentId,
        doctorId: payload.doctorId,
        patientId: payload.patientId,
        email: payload.email,
        phoneNumber: payload.phone,
        message: notification.message,
        payload,
    });
};

const buildVideoNotificationMessages = (payload, routingKey) => {
    const roomUrl = payload.roomUrl || payload.roomId || 'your session room';
    const displayDate = payload.date || 'your scheduled date';
    const displayTime = payload.time || 'your scheduled time';

    switch (routingKey) {
        case 'video.session.created':
            return {
                subject: 'NexusCare Video Session Ready',
                message: `Hello,

Your NexusCare video consultation is ready. Join using this link: ${roomUrl}${payload.roomUrl ? '' : ` (Room ID: ${payload.roomId})`}.

Your appointment is scheduled for ${displayDate} at ${displayTime}.

Thank you,
NexusCare Team`,
                sms: `Your NexusCare video session is ready. Join here: ${roomUrl}`,
            };
        case 'video.session.ended':
            return {
                subject: 'Your NexusCare Video Session Completed',
                message: `Hello,

Your NexusCare video consultation has ended successfully. Thank you for using NexusCare.

If you need follow-up care, please return to the app.

Best regards,
NexusCare Team`,
                sms: `Your NexusCare video session has ended. Thank you for using NexusCare.`,
            };
        default:
            return null;
    }
};

const processVideoNotificationEvent = async (payload, routingKey) => {
    const notification = buildVideoNotificationMessages(payload, routingKey);
    if (!notification) {
        throw new Error(`Unsupported routing key: ${routingKey}`);
    }

    const promises = [];
    if (payload.patientEmail) {
        promises.push(sendEmailPayload({ email: payload.patientEmail, subject: notification.subject, message: notification.message }));
    }
    if (payload.doctorEmail) {
        promises.push(sendEmailPayload({ email: payload.doctorEmail, subject: notification.subject, message: notification.message }));
    }
    if (payload.patientPhone) {
        promises.push(sendSMSPayload({ phoneNumber: payload.patientPhone, message: notification.sms }));
    }
    if (payload.doctorPhone) {
        promises.push(sendSMSPayload({ phoneNumber: payload.doctorPhone, message: notification.sms }));
    }

    const results = await Promise.allSettled(promises);
    const errors = results.filter((result) => result.status === 'rejected').map((result) => result.reason);
    if (errors.length) {
        throw new Error(`Video session notification failed: ${errors.map((err) => err.message || err).join('; ')}`);
    }

    await saveNotificationRecord({
        type: 'video',
        event: routingKey,
        status: 'sent',
        appointmentId: payload.appointmentId,
        doctorId: payload.doctorId,
        patientId: payload.patientId,
        email: payload.patientEmail || payload.doctorEmail,
        phoneNumber: payload.patientPhone || payload.doctorPhone,
        message: notification.message,
        payload,
    });
};

const saveNotificationRecord = async (data) => {
    const notification = new Notification(data);
    return notification.save();
};

const logNotification = async (req, res, next) => {
    try {
        const internalKey = req.headers['x-internal-service-key'];
        if (internalKey !== config.INTERNAL_SERVICE_KEY) {
            const error = new Error('Unauthorized');
            error.statusCode = 403;
            throw error;
        }

        const {
            type,
            event,
            status,
            appointmentId,
            paymentId,
            doctorId,
            patientId,
            email,
            phoneNumber,
            message,
            payload = {},
        } = req.body;

        const saved = await saveNotificationRecord({
            type,
            event,
            status,
            appointmentId,
            paymentId,
            doctorId,
            patientId,
            email,
            phoneNumber,
            message,
            payload,
        });

        return res.status(201).json({ success: true, data: saved });
    } catch (error) {
        error.statusCode = error.statusCode || 500;
        next(error);
    }
};

const getEmailTransporter = () => {
    const user = config.GMAIL_USER;
    const pass = config.GMAIL_PASS;

    if (!user || !pass) {
        throw new Error('GMAIL_USER and GMAIL_PASS must be configured for notification email delivery');
    }

    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user,
            pass,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });
};

/**
 * 2. Send Email Function
 */
const sendEmail = async (req, res, next) => {
    try {
        const { email, subject, message } = req.body;
        const transporter = getEmailTransporter();

        console.log(`📩 Notification-service will send email to: ${email}`);
        const info = await transporter.sendMail({
            from: `"NexusCare" <${config.GMAIL_USER}>`,
            to: email,
            subject,
            text: message,
        });

        console.log(`✅ Email sent successfully to: ${email}`, info);
        res.status(200).json({
            success: true,
            message: `Email sent to ${email}`,
            info,
        });
    } catch (error) {
        error.statusCode = error.statusCode || 500;
        next(error);
    }
};

/**
 * 3. Send registration email (doctor or patient)
 */
const sendRegistrationEmail = async (req, res, next) => {
    try {
        const { email, name, role } = req.body;
        await sendRegistrationEmailPayload({ email, name, role });

        console.log(`✅ Registration Email sent to: ${email}`);
        res.status(200).json({ success: true, message: `Registration email sent to ${email}` });
    } catch (error) {
        error.statusCode = error.statusCode || 500;
        next(error);
    }
};


module.exports = {
  sendEmail,
  sendSMS,
  sendRegistrationEmail,
  sendRegistrationEmailPayload,
  sendSMSPayload,
  logNotification,
  sendEmailPayload,
  processAppointmentNotificationEvent,
  processVideoNotificationEvent,
};
