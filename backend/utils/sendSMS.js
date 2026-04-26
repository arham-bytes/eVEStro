/**
 * Sends an SMS using a placeholder/simulated service.
 * In a real production app, you would use Twilio, Vonage, or Fast2SMS.
 */
const sendSMS = async (options) => {
    try {
        console.log(`📱 SMS sent to ${options.phone}: ${options.message}`);
        
        // Example: If you have Twilio config in .env
        /*
        if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN) {
            const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
            await client.messages.create({
                body: options.message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: options.phone
            });
            return true;
        }
        */

        return true;
    } catch (error) {
        console.error('❌ SMS utility error:', error.message);
        return false;
    }
};

module.exports = sendSMS;
