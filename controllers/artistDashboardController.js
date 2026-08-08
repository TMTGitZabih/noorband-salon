// controllers/artistDashboardController.js
// Everything a logged-in Artist can do. All queries are scoped to the
// artist's own profile/userId so they can never see another artist's data.

const Artist = require('../models/Artist');
const Booking = require('../models/Booking');
const User = require('../models/User');

async function getOwnArtistProfile(req) {
  return Artist.findOne({ user: req.session.userId }).populate('user');
}

exports.dashboard = async (req, res, next) => {
  try {
    const artist = await getOwnArtistProfile(req);
    if (!artist) return res.status(404).render('errors/404', { title: 'Artist profile not found' });

    const todayStr = new Date().toISOString().slice(0, 10);

    const [todayBookings, upcomingBookings] = await Promise.all([
      Booking.find({ artist: artist._id, date: todayStr, status: { $in: ['confirmed', 'completed'] } })
        .populate('service')
        .sort({ time: 1 }),
      Booking.find({
        artist: artist._id,
        date: { $gt: todayStr },
        status: 'confirmed'
      })
        .populate('service')
        .sort({ date: 1, time: 1 })
        .limit(20)
    ]);

    res.render('dashboard/artist/dashboard', {
      title: 'My Dashboard',
      layout: 'layouts/dashboard',
      artist,
      todayBookings,
      upcomingBookings
    });
  } catch (err) {
    next(err);
  }
};

exports.profile = async (req, res, next) => {
  try {
    const artist = await getOwnArtistProfile(req);
    res.render('dashboard/artist/profile', {
      title: 'My Profile',
      layout: 'layouts/dashboard',
      artist,
      success: null,
      error: null
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const artist = await getOwnArtistProfile(req);
    const { bio, experienceYears, specialties, phone, profileImage } = req.body;

    artist.bio = bio || '';
    artist.experienceYears = Number(experienceYears) || 0;
    artist.specialties = (specialties || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    await artist.save();

    await User.findByIdAndUpdate(req.session.userId, {
      phone: phone || undefined,
      profileImage: profileImage || ''
    });

    res.render('dashboard/artist/profile', {
      title: 'My Profile',
      layout: 'layouts/dashboard',
      artist: await getOwnArtistProfile(req),
      success: 'Profile updated successfully.',
      error: null
    });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findById(req.session.userId);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      const artist = await getOwnArtistProfile(req);
      return res.render('dashboard/artist/profile', {
        title: 'My Profile',
        layout: 'layouts/dashboard',
        artist,
        success: null,
        error: 'Current password is incorrect.'
      });
    }

    if (newPassword !== confirmPassword) {
      const artist = await getOwnArtistProfile(req);
      return res.render('dashboard/artist/profile', {
        title: 'My Profile',
        layout: 'layouts/dashboard',
        artist,
        success: null,
        error: 'New passwords do not match.'
      });
    }

    user.password = newPassword; // hashed by the pre-save hook
    await user.save();

    const artist = await getOwnArtistProfile(req);
    res.render('dashboard/artist/profile', {
      title: 'My Profile',
      layout: 'layouts/dashboard',
      artist,
      success: 'Password changed successfully.',
      error: null
    });
  } catch (err) {
    next(err);
  }
};

// Ensures a booking belongs to the logged-in artist before allowing mutation.
async function assertOwnsBooking(req) {
  const artist = await getOwnArtistProfile(req);
  const booking = await Booking.findOne({ _id: req.params.bookingId, artist: artist._id });
  return booking;
}

exports.markCompleted = async (req, res, next) => {
  try {
    const booking = await assertOwnsBooking(req);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    booking.status = 'completed';
    await booking.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await assertOwnsBooking(req);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    booking.status = 'cancelled';
    await booking.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
