// routes/adminRoutes.js
const express = require('express');
const router = express.Router();

const controller = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(requireAuth, requireAdmin);

router.get('/dashboard', controller.dashboard);

// Artists
router.get('/artists', controller.listArtists);
router.get('/artists/new', controller.newArtistForm);
router.post('/artists', controller.createArtist);
router.get('/artists/:id/edit', controller.editArtistForm);
router.post('/artists/:id', controller.updateArtist);
router.delete('/artists/:id', controller.deleteArtist);
router.post('/artists/:id/reset-password', controller.resetArtistPassword);

// Services
router.get('/services', controller.listServices);
router.post('/services', controller.createService);
router.get('/services/:id/edit', controller.editServiceForm);
router.post('/services/:id', controller.updateService);
router.delete('/services/:id', controller.deleteService);

// Bookings
router.get('/bookings', controller.listBookings);
router.post('/bookings/:id/status', controller.updateBookingStatus);

// Gallery
router.get('/gallery', controller.listGallery);
router.post('/gallery', upload.single('image'), controller.addGalleryImage);
router.delete('/gallery/:id', controller.deleteGalleryImage);

// Settings
router.get('/settings', controller.showSettings);
router.post('/settings', controller.updateSettings);

module.exports = router;
