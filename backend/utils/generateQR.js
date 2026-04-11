const QRCode = require('qrcode');

const generateQR = async (data) => {
    try {
        const payload = typeof data === 'string' ? data : JSON.stringify(data);
        const qrDataURL = await QRCode.toDataURL(payload, {
            width: 300,
            margin: 2,
            color: {
                dark: '#1a1a2e',
                light: '#ffffff',
            },
        });
        return qrDataURL;
    } catch (error) {
        console.error('QR Code generation failed:', error);
        throw new Error('Failed to generate QR code');
    }
};

module.exports = generateQR;
