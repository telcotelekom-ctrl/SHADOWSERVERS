const QRCode = require('qrcode');

// Generates a QR code (as a data URL) pointing at the PSY-TEL Hotspot Studio
// so a phone can scan it and join the broadcast / audience view instantly.
async function generateQrDataUrl(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('text is required to generate a QR code');
  }
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
    color: {
      dark: '#e5e7eb',
      light: '#020617'
    }
  });
}

module.exports = { generateQrDataUrl };
