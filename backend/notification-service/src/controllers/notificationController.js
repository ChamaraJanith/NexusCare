const twilio = require('twilio');
const nodemailer = require('nodemailer');
require('dotenv').config();

// --- Twilio Configuration ---
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
const twilioMessagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
const twilioClient = new twilio(accountSid, authToken);

// --- Notify.lk configuration ---
const notifyLKUserId = process.env.NOTIFYLK_USER_ID;
const notifyLKApiKey = process.env.NOTIFYLK_API_KEY;
const notifyLKsenderId = process.env.NOTIFYLK_SENDER_ID || 'NEXUSCARE';

// Provider selection
const SMS_PROVIDER = (process.env.SMS_PROVIDER || 'twilio').toLowerCase();

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

    const baseUrl = process.env.NOTIFYLK_BASE_URL || 'https://app.notify.lk';

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
            const url = new URL('/api/v1/send', baseUrl);
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
            const url = `${baseUrl}/api/v1/send?${queryString}`;
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

const sendSMS = async (req, res) => {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
        return res.status(400).json({ success: false, error: 'phoneNumber and message are required' });
    }

    const normalized = normalizePhoneNumber(phoneNumber);
    if (!normalized) {
        return res.status(400).json({ success: false, error: 'Invalid phone number format. Use +947xxxxxxx or 07xxxxxxx.' });
    }

    try {
        let result;

        if (SMS_PROVIDER === 'notifylk') {
            result = await sendSMSViaNotifyLK(normalized, message);
            console.log(`✅ notify.lk SMS sent to ${normalized}`, result);
        } else {
            result = await sendSMSViaTwilio(normalized, message);
            console.log(`✅ Twilio SMS sent to ${normalized}`, result.sid);
        }

        return res.status(200).json({ success: true, provider: SMS_PROVIDER, result });
    } catch (error) {
        console.error('❌ SMS Error:', error);
        return res.status(500).json({ success: false, error: error.message || 'SMS send failed' });
    }
};

const getEmailTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });
};

/**
 * 2. Send Email Function
 */
const sendEmail = async (req, res) => {
    const { email, subject, message } = req.body;
    
    const transporter = getEmailTransporter();

    try {
        await transporter.sendMail({
            from: `"NexusCare" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: subject,
            text: message
        });

        console.log(`✅ Email sent successfully to: ${email}`);
        res.status(200).json({ 
            success: true, 
            message: `Email sent to ${email}` 
        });
    } catch (error) {
        console.error("❌ Email Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * 3. Send registration email (doctor or patient)
 */
const sendRegistrationEmail = async (req, res) => {
    const { email, name, role } = req.body;

    if (!email || !name || !role) {
        return res.status(400).json({
            success: false,
            message: 'email, name and role are required.'
        });
    }

    const displayRole = role === 'doctor' ? 'Doctor' : 'Patient';
    const subject = `Welcome to NexusCare, ${displayRole}!`;
    const message = `Hello ${name},\n\n` +
        `Your ${displayRole.toLowerCase()} account has been created successfully on NexusCare.\n` +
        `You can now login and use the platform.\n\n` +
        `Best regards,\nNexusCare Team`;

    try {
        const transporter = getEmailTransporter();
        await transporter.sendMail({
            from: `"NexusCare" <${process.env.GMAIL_USER}>`,
            to: email,
            subject,
            text: message
        });

        console.log(`✅ Registration Email sent to: ${email}`);
        res.status(200).json({ success: true, message: `Registration email sent to ${email}` });
    } catch (error) {
        console.error('❌ Registration Email Error:', error.message, error.response || error);
        res.status(500).json({ success: false, error: error.message });
    }
};


module.exports = { sendEmail, sendSMS, sendRegistrationEmail };