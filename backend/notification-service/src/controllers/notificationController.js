const twilio = require('twilio');
const nodemailer = require('nodemailer');

// --- Twilio Configuration ---
const accountSid = 'AC521168924dfe8da3c5a10d093a739303'; 
const authToken = 'ba33c115519cbdfcb049526475bac365'; 
const twilioNumber = '+14784296373'; // 💡 ඔයාට Twilio එකෙන් ලැබුණු නම්බර් එක මෙතනට දාන්න (මම උදාහරණයක් දැම්මේ)

const client = new twilio(accountSid, authToken);

// --- SMS Function ---
const sendSMS = async (req, res) => {
    const { phoneNumber, message } = req.body;

    try {
        const response = await client.messages.create({
            body: message,
            to: phoneNumber, // උදා: +94767691846
            from: twilioNumber
        });

        console.log(`✅ SMS Sent Successfully! SID: ${response.sid}`);
        res.status(200).json({ success: true, sid: response.sid });
    } catch (error) {
        console.error("❌ Twilio SMS Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

const sendEmail = async (req, res) => {
    const { email, subject, message } = req.body;
    
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'chamarasweed44@gmail.com', 
            pass: 'jstm waee gegm uybb'
        }
    });

    try {
        await transporter.sendMail({
            from: '"NexusCare" <no-reply@nexuscare.com>',
            to: email,
            subject: subject,
            text: message
        });
        console.log(`✅ Email sent to: ${email}`);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { sendEmail, sendSMS };