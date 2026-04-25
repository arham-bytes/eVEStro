const nodemailer = require('nodemailer');

/**
 * Sends an email using Resend API (preferred) or Nodemailer SMTP (fallback)
 */
const sendEmail = async (options) => {
    try {
        // 1. Try Resend API (Best for Vercel/Serverless)
        if (process.env.RESEND_API_KEY) {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
                },
                body: JSON.stringify({
                    from: 'eVEStro <onboarding@resend.dev>', // You should verify your own domain later
                    to: options.to,
                    subject: options.subject,
                    html: options.html
                })
            });

            if (response.ok) {
                console.log(`📧 Email sent via Resend to ${options.to}`);
                return true;
            }
            console.error('❌ Resend API Error:', await response.text());
        }

        // 2. Fallback to Nodemailer SMTP
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            const mailOptions = {
                from: `"eVEStro" <${process.env.SMTP_USER}>`,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
            };

            await transporter.sendMail(mailOptions);
            console.log(`📧 Email sent via SMTP to ${options.to}`);
            return true;
        }

        // 3. Last Resort: Log to console in development
        console.log('📧 Email (simulated):', { to: options.to, subject: options.subject });
        return true;
    } catch (error) {
        console.error('❌ Email utility error:', error.message);
        return false;
    }
};

module.exports = sendEmail;
