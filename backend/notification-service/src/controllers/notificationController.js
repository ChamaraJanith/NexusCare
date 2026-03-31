const twilio = require('twilio');
const nodemailer = require('nodemailer');
require('dotenv').config();

// --- Twilio Configuration ---
const accountSid = process.env.TWILIO_ACCOUNT_SID; 
const authToken = process.env.TWILIO_AUTH_TOKEN; 
const twilioNumber = process.env.TWILIO_PHONE_NUMBER; 

const client = new twilio(accountSid, authToken);

/**
 * 1. Send SMS Function
 */
const sendSMS = async (req, res) => {
    const { phoneNumber, message } = req.body;

    try {
        const response = await client.messages.create({
            body: message,
            to: phoneNumber,
            from: twilioNumber
        });

        console.log(`✅ SMS Sent Successfully! SID: ${response.sid}`);
        res.status(200).json({ 
            success: true, 
            message: "SMS sent successfully", 
            sid: response.sid 
        });
    } catch (error) {
        console.error("❌ Twilio SMS Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
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