// routes/artistDashboardRoutes.js
const express = require('express');
const router = express.Router();

const controller = require('../controllers/artistDashboardController');
const { requireAuth, requireArtist } = require('../middleware/auth');

router.use(requireAuth, requireArtist);

router.get('/dashboard', controller.dashboard);
router.get('/profile', controller.profile);
router.post('/profile', controller.updateProfile);
router.post('/change-password', controller.changePassword);
router.post('/bookings/:bookingId/complete', controller.markCompleted);
router.post('/bookings/:bookingId/cancel', controller.cancelBooking);

module.exports = router;
