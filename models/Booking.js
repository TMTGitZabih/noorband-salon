// models/Booking.js
// A customer appointment. Bookings are confirmed immediately on submit --
// there is no WhatsApp/SMS verification step.

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
      enum: ['confirmed', 'completed', 'cancelled'],
      default: 'confirmed'
    }
  },
  { timestamps: true }
);

// Prevent two confirmed/completed bookings for the same artist at the same
// date+time.
bookingSchema.index({ artist: 1, date: 1, time: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
