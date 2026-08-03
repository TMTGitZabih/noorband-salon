// controllers/bookingController.js
// Public booking flow (simplified -- no WhatsApp/OTP verification step):
//   1. GET  /book                -> booking form (artists + services)
//   2. GET  /book/availability   -> AJAX: free time slots for artist+date+service
//   3. POST /book                -> creates the booking as "confirmed" immediately
//   4. GET  /book/confirmed/:id  -> confirmation page

const Artist = require('../models/Artist');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const { getAvailableSlots } = require('../utils/availability');

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
      status: 'confirmed'
    });

    res.json({ success: true, bookingId: booking._id, redirectTo: `/book/confirmed/${booking._id}` });
  } catch (err) {
    next(err);
  }
};

exports.showConfirmation = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('artist').populate('service');
    if (!booking) return res.status(404).render('errors/404', { title: 'Booking not found' });

    res.render('booking-confirmed', { title: 'Booking Confirmed', booking });
  } catch (err) {
    next(err);
  }
};
