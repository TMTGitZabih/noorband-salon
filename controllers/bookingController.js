// controllers/bookingController.js
// Public booking flow:
//   1. GET  /book                    -> booking form (artists + services)
//   2. GET  /book/availability       -> AJAX: free time slots for artist+date+service
//   3. POST /book                    -> creates a pending_verification booking, sends OTP
//   4. GET  /book/verify/:id         -> OTP entry page
//   5. POST /book/verify/:id         -> checks OTP, confirms booking, notifies salon
//   6. POST /book/verify/:id/resend  -> resends a fresh OTP

const Artist = require('../models/Artist');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const { getAvailableSlots } = require('../utils/availability');
const { generateOtp, sendOtp, sendBookingConfirmation, sendWhatsAppMessage } = require('../utils/whatsapp');
// salon contact info (name, WhatsApp number) comes from res.locals.salon,
// set per-request by middleware/loadSettings.js.

exports.showBookingForm = async (req, res, next) => {
  try {
    const [artists, services] = await Promise.all([
      Artist.find({ isActive: true }).populate('user', 'name profileImage').populate('services'),
      Service.find({ isActive: true }).sort({ category: 1, name: 1 })
    ]);

    const preselectedArtist = req.query.artist || '';

    res.render('booking', {
      title: 'Book an Appointment',
      artists,
      services,
      preselectedArtist,
      formError: null
    });
  } catch (err) {
    next(err);
  }
};

// AJAX endpoint used by public/js/booking.js to populate the time dropdown.
exports.getAvailability = async (req, res, next) => {
  try {
    const { artistId, date, serviceId } = req.query;
    if (!artistId || !date || !serviceId) {
      return res.status(400).json({ success: false, message: 'artistId, date and serviceId are required' });
    }

    const [artist, service] = await Promise.all([Artist.findById(artistId), Service.findById(serviceId)]);
    if (!artist || !service) {
      return res.status(404).json({ success: false, message: 'Artist or service not found' });
    }

    // Don't allow booking in the past.
    const todayStr = new Date().toISOString().slice(0, 10);
    if (date < todayStr) {
      return res.json({ success: true, slots: [] });
    }

    const slots = await getAvailableSlots(artist, date, service.durationMinutes);
    res.json({ success: true, slots });
  } catch (err) {
    next(err);
  }
};

exports.createBooking = async (req, res, next) => {
  try {
    const { customerName, phone, whatsapp, email, notes, artistId, serviceId, date, time } = req.body;

    const [artist, service] = await Promise.all([Artist.findById(artistId), Service.findById(serviceId)]);
    if (!artist || !service) {
      return res.status(400).json({ success: false, message: 'Invalid artist or service selected.' });
    }

    // Re-check availability server-side right before creating, so two
    // customers racing for the same slot can't both succeed.
    const freeSlots = await getAvailableSlots(artist, date, service.durationMinutes);
    if (!freeSlots.includes(time)) {
      return res.status(409).json({
        success: false,
        message: 'Sorry, that time slot was just taken. Please choose another time.'
      });
    }

    const otpCode = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const booking = await Booking.create({
      customerName,
      phone,
      whatsapp,
      email: email || '',
      notes: notes || '',
      artist: artist._id,
      service: service._id,
      date,
      time,
      status: 'pending_verification',
      otpCode,
      otpExpiresAt,
      otpAttempts: 0
    });

    await sendOtp(whatsapp, otpCode, res.locals.salon.name);

    res.json({ success: true, bookingId: booking._id, redirectTo: `/book/verify/${booking._id}` });
  } catch (err) {
    next(err);
  }
};

exports.showVerifyForm = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('artist').populate('service');
    if (!booking) return res.status(404).render('errors/404', { title: 'Booking not found' });

    if (booking.status !== 'pending_verification') {
      return res.render('booking-confirmed', { title: 'Booking Confirmed', booking });
    }

    res.render('booking-verify', { title: 'Verify Your WhatsApp Number', booking, error: null });
  } catch (err) {
    next(err);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const booking = await Booking.findById(req.params.id)
      .select('+otpCode +otpExpiresAt +otpAttempts')
      .populate('artist')
      .populate('service');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.status !== 'pending_verification') {
      return res.json({ success: true, alreadyVerified: true, redirectTo: `/book/verify/${booking._id}` });
    }

    if (booking.otpAttempts >= 5) {
      return res.status(429).json({ success: false, message: 'Too many attempts. Please start a new booking.' });
    }

    if (!booking.otpExpiresAt || booking.otpExpiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'This code has expired. Please request a new one.' });
    }

    if (otp !== booking.otpCode) {
      booking.otpAttempts += 1;
      await booking.save();
      return res.status(400).json({ success: false, message: 'Incorrect code. Please try again.' });
    }

    booking.status = 'confirmed';
    booking.verifiedAt = new Date();
    booking.otpCode = undefined;
    booking.otpExpiresAt = undefined;
    await booking.save();

    // Notify the customer and the salon.
    const salonSettings = res.locals.salon;
    await sendBookingConfirmation(booking.whatsapp, booking, salonSettings.name);
    if (salonSettings.whatsapp) {
      await sendWhatsAppMessage(
        salonSettings.whatsapp,
        `New booking: ${booking.customerName} on ${booking.date} at ${booking.time}.`
      );
    }

    res.json({ success: true, redirectTo: `/book/verify/${booking._id}` });
  } catch (err) {
    next(err);
  }
};

exports.resendOtp = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).select('+otpCode +otpExpiresAt +otpAttempts');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.status !== 'pending_verification') {
      return res.status(400).json({ success: false, message: 'This booking is already verified.' });
    }

    booking.otpCode = generateOtp();
    booking.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    booking.otpAttempts = 0;
    await booking.save();

    await sendOtp(booking.whatsapp, booking.otpCode, res.locals.salon.name);
    res.json({ success: true, message: 'A new code has been sent to your WhatsApp.' });
  } catch (err) {
    next(err);
  }
};
