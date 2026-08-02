// utils/whatsapp.js
// Sends WhatsApp messages via Twilio's WhatsApp API when credentials are
// configured. Without credentials (e.g. local development, or before you've
// set up a Twilio account) it falls back to logging the message to the
// console so the booking flow still works end-to-end during development.
//
// To go live: create a Twilio account, enable WhatsApp on a sender number
// (https://www.twilio.com/docs/whatsapp/quickstart), then set
// TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_WHATSAPP_FROM in .env.

let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  const twilio = require('twilio');
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

function normalizeWhatsAppNumber(number) {
  const trimmed = number.trim();
  return trimmed.startsWith('whatsapp:') ? trimmed : `whatsapp:${trimmed}`;
}

async function sendWhatsAppMessage(toNumber, message) {
  if (!twilioClient) {
    console.log('--- [DEV MODE: WhatsApp not configured] ---');
    console.log(`To: ${toNumber}`);
    console.log(`Message: ${message}`);
    console.log('--------------------------------------------');
    return { simulated: true };
  }

  return twilioClient.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: normalizeWhatsAppNumber(toNumber),
    body: message
  });
}

async function sendOtp(whatsappNumber, otpCode, salonName) {
  const message = `${salonName}: your booking verification code is ${otpCode}. It expires in 10 minutes. Do not share this code.`;
  return sendWhatsAppMessage(whatsappNumber, message);
}

async function sendBookingConfirmation(whatsappNumber, booking, salonName) {
  const message = `${salonName}: your appointment on ${booking.date} at ${booking.time} is confirmed. We look forward to seeing you!`;
  return sendWhatsAppMessage(whatsappNumber, message);
}

module.exports = { generateOtp, sendOtp, sendBookingConfirmation, sendWhatsAppMessage };
