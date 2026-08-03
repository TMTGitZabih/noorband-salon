// controllers/adminController.js
// Full admin control: artists, services, bookings, gallery, and salon settings.

const crypto = require('crypto');
const User = require('../models/User');
const Artist = require('../models/Artist');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const GalleryImage = require('../models/GalleryImage');
const Setting = require('../models/Setting');
const { invalidateSettingsCache } = require('../middleware/loadSettings');
const { DAY_NAMES } = require('../utils/availability');

// ---------- Dashboard / stats ----------

exports.dashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfWeekStr = startOfWeek.toISOString().slice(0, 10);

    const startOfMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const [artistCount, serviceCount, todayCount, weekCount, monthCount, recentBookings] =
      await Promise.all([
        Artist.countDocuments({ isActive: true }),
        Service.countDocuments({ isActive: true }),
        Booking.countDocuments({ date: todayStr, status: { $in: ['confirmed', 'completed'] } }),
        Booking.countDocuments({ date: { $gte: startOfWeekStr }, status: { $in: ['confirmed', 'completed'] } }),
        Booking.countDocuments({ date: { $gte: startOfMonthStr }, status: { $in: ['confirmed', 'completed'] } }),
        Booking.find({ status: { $in: ['confirmed', 'completed'] } })
          .sort({ createdAt: -1 })
          .limit(8)
          .populate({ path: 'artist', populate: { path: 'user', select: 'name' } })
          .populate('service')
      ]);

    res.render('dashboard/admin/dashboard', {
      title: 'Admin Dashboard',
      layout: 'layouts/dashboard',
      stats: { artistCount, serviceCount, todayCount, weekCount, monthCount },
      recentBookings
    });
  } catch (err) {
    next(err);
  }
};

// ---------- Artists ----------

exports.listArtists = async (req, res, next) => {
  try {
    const artists = await Artist.find().populate('user');
    res.render('dashboard/admin/artists', { title: 'Manage Artists', layout: 'layouts/dashboard', artists, error: null });
  } catch (err) {
    next(err);
  }
};

exports.newArtistForm = async (req, res, next) => {
  try {
    const services = await Service.find({ isActive: true });
    res.render('dashboard/admin/artist-form', {
      title: 'Add Artist',
      layout: 'layouts/dashboard',
      services,
      artist: null,
      artistUser: null,
      error: null
    });
  } catch (err) {
    next(err);
  }
};

exports.createArtist = async (req, res, next) => {
  try {
    const { name, email, password, phone, bio, experienceYears, specialties, services } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      const svc = await Service.find({ isActive: true });
      return res.status(400).render('dashboard/admin/artist-form', {
        title: 'Add Artist',
        layout: 'layouts/dashboard',
        services: svc,
        artist: null,
        artistUser: null,
        error: 'An account with that email already exists.'
      });
    }

    const user = await User.create({ name, email, password, role: 'artist', phone });

    await Artist.create({
      user: user._id,
      bio: bio || '',
      experienceYears: Number(experienceYears) || 0,
      specialties: (specialties || '').split(',').map((s) => s.trim()).filter(Boolean),
      services: Array.isArray(services) ? services : services ? [services] : []
    });

    res.redirect('/admin/artists');
  } catch (err) {
    next(err);
  }
};

exports.editArtistForm = async (req, res, next) => {
  try {
    const [artist, services] = await Promise.all([
      Artist.findById(req.params.id).populate('user'),
      Service.find({ isActive: true })
    ]);
    if (!artist) return res.status(404).render('errors/404', { title: 'Artist not found' });

    res.render('dashboard/admin/artist-form', {
      title: 'Edit Artist',
      layout: 'layouts/dashboard',
      services,
      artist,
      artistUser: artist.user,
      error: null
    });
  } catch (err) {
    next(err);
  }
};

exports.updateArtist = async (req, res, next) => {
  try {
    const { name, phone, bio, experienceYears, specialties, services, isActive } = req.body;
    const artist = await Artist.findById(req.params.id);
    if (!artist) return res.status(404).render('errors/404', { title: 'Artist not found' });

    await User.findByIdAndUpdate(artist.user, { name, phone });

    artist.bio = bio || '';
    artist.experienceYears = Number(experienceYears) || 0;
    artist.specialties = (specialties || '').split(',').map((s) => s.trim()).filter(Boolean);
    artist.services = Array.isArray(services) ? services : services ? [services] : [];
    artist.isActive = isActive === 'on';

    // Update working hours from the form (7 rows submitted as arrays).
    if (req.body.workDay) {
      const days = [].concat(req.body.workDay);
      const isWorkingList = [].concat(req.body.isWorking || []);
      const startTimes = [].concat(req.body.startTime);
      const endTimes = [].concat(req.body.endTime);

      artist.workingHours = days.map((day, i) => ({
        day,
        isWorking: isWorkingList.includes(day),
        startTime: startTimes[i],
        endTime: endTimes[i]
      }));
    }

    await artist.save();
    res.redirect('/admin/artists');
  } catch (err) {
    next(err);
  }
};

exports.deleteArtist = async (req, res, next) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) return res.status(404).json({ success: false, message: 'Artist not found.' });

    await User.findByIdAndDelete(artist.user);
    await artist.deleteOne();

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.resetArtistPassword = async (req, res, next) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) return res.status(404).json({ success: false, message: 'Artist not found.' });

    const tempPassword = crypto.randomBytes(4).toString('hex'); // 8-char temp password
    const user = await User.findById(artist.user);
    user.password = tempPassword; // hashed by pre-save hook
    await user.save();

    res.json({ success: true, tempPassword });
  } catch (err) {
    next(err);
  }
};

// ---------- Services ----------

exports.listServices = async (req, res, next) => {
  try {
    const services = await Service.find().sort({ category: 1, name: 1 });
    res.render('dashboard/admin/services', { title: 'Manage Services', layout: 'layouts/dashboard', services });
  } catch (err) {
    next(err);
  }
};

exports.createService = async (req, res, next) => {
  try {
    const { name, category, description, price, durationMinutes, image } = req.body;
    await Service.create({
      name,
      category,
      description,
      price: Number(price),
      durationMinutes: Number(durationMinutes),
      image: image || undefined
    });
    res.redirect('/admin/services');
  } catch (err) {
    next(err);
  }
};

exports.updateService = async (req, res, next) => {
  try {
    const { name, category, description, price, durationMinutes, image, isActive } = req.body;
    await Service.findByIdAndUpdate(req.params.id, {
      name,
      category,
      description,
      price: Number(price),
      durationMinutes: Number(durationMinutes),
      image: image || undefined,
      isActive: isActive === 'on'
    });
    res.redirect('/admin/services');
  } catch (err) {
    next(err);
  }
};

exports.deleteService = async (req, res, next) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ---------- Bookings ----------

exports.listBookings = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.date) filter.date = req.query.date;

    const bookings = await Booking.find(filter)
      .sort({ date: -1, time: -1 })
      .populate({ path: 'artist', populate: { path: 'user', select: 'name' } })
      .populate('service');

    res.render('dashboard/admin/bookings', {
      title: 'All Bookings',
      layout: 'layouts/dashboard',
      bookings,
      filterStatus: req.query.status || '',
      filterDate: req.query.date || ''
    });
  } catch (err) {
    next(err);
  }
};

exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ---------- Gallery ----------

exports.listGallery = async (req, res, next) => {
  try {
    const images = await GalleryImage.find().sort({ category: 1, displayOrder: 1 });
    res.render('dashboard/admin/gallery', { title: 'Manage Gallery', layout: 'layouts/dashboard', images });
  } catch (err) {
    next(err);
  }
};

exports.addGalleryImage = async (req, res, next) => {
  try {
    const { title, category, imageUrl } = req.body;
    const finalUrl = req.file ? `/images/uploads/${req.file.filename}` : imageUrl;
    if (!finalUrl) {
      const images = await GalleryImage.find().sort({ category: 1, displayOrder: 1 });
      return res.status(400).render('dashboard/admin/gallery', {
        title: 'Manage Gallery',
        layout: 'layouts/dashboard',
        images,
        error: 'Please upload a file or provide an image URL.'
      });
    }
    await GalleryImage.create({ title, category, imageUrl: finalUrl });
    res.redirect('/admin/gallery');
  } catch (err) {
    next(err);
  }
};

exports.deleteGalleryImage = async (req, res, next) => {
  try {
    await GalleryImage.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ---------- Settings ----------

exports.showSettings = async (req, res, next) => {
  try {
    const settings = await Setting.getSingleton();
    res.render('dashboard/admin/settings', {
      title: 'Salon Settings',
      layout: 'layouts/dashboard',
      settings,
      dayNames: DAY_NAMES,
      success: null
    });
  } catch (err) {
    next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { name, phone, whatsapp, email, address, instagram, facebook, tiktok } = req.body;
    const days = [].concat(req.body.day || []);
    const hours = [].concat(req.body.hours || []);
    const openingHours = days.map((day, i) => ({ day, hours: hours[i] }));

    const settings = await Setting.getSingleton();
    Object.assign(settings, { name, phone, whatsapp, email, address, instagram, facebook, tiktok, openingHours });
    await settings.save();
    invalidateSettingsCache();

    res.render('dashboard/admin/settings', {
      title: 'Salon Settings',
      layout: 'layouts/dashboard',
      settings,
      dayNames: DAY_NAMES,
      success: 'Settings updated successfully.'
    });
  } catch (err) {
    next(err);
  }
};
