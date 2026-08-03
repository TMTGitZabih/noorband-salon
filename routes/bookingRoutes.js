// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();

const bookingController = require('../controllers/bookingController');
const { bookingRules } = require('../middleware/validators');
const { validationResult } = require('express-validator');

router.get('/book', bookingController.showBookingForm);
router.get('/book/availability', bookingController.getAvailability);

router.post('/book', bookingRules, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  next();
}, bookingController.createBooking);

router.get('/book/confirmed/:id', bookingController.showConfirmation);

module.exports = router;
