// models/Booking.js
// A customer appointment. Includes WhatsApp OTP verification fields so a
// booking only becomes "confirmed" after the customer proves they own the
// WhatsApp number they gave us.

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    whatsapp: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: '' },
    notes: { type: String, default: '' },

    artist: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },

    // Stored as a plain date-only string (YYYY-MM-DD) and a "HH:MM" start time,
    // both in the salon's local time, to keep slot math simple and unambiguous.
    date: { type: String, required: true },
    time: { type: String, required: true },

    status: {
      type: String,
      enum: ['pending_verification', 'confirmed', 'completed', 'cancelled'],
      default: 'pending_verification'
    },

    // WhatsApp OTP verification
    otpCode: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
    verifiedAt: { type: Date }
  },
  { timestamps: true }
);

// Prevent two CONFIRMED/completed bookings for the same artist at the same
// date+time. Unverified (pending_verification) holds are allowed to expire
// via TTL-style cleanup in the booking controller instead of a hard unique
// index, so a customer who abandons OTP entry doesn't permanently lock a slot.
bookingSchema.index({ artist: 1, date: 1, time: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
