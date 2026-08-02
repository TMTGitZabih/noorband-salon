// middleware/validators.js
// express-validator rule sets, reused across routes for consistent input
// validation and clear error messages.

const { body, validationResult } = require('express-validator');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flashErrors = errors.array().map((e) => e.msg);
    return res.status(400).json({ success: false, errors: req.flashErrors });
  }
  next();
}

const loginRules = [
  body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

const bookingRules = [
  body('customerName').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('whatsapp').trim().notEmpty().withMessage('WhatsApp number is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Enter a valid email'),
  body('artistId').notEmpty().withMessage('Please select an artist'),
  body('serviceId').notEmpty().withMessage('Please select a service'),
  body('date').notEmpty().withMessage('Please select a date'),
  body('time').notEmpty().withMessage('Please select a time')
];

const contactRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Enter a valid email'),
  body('message').trim().notEmpty().withMessage('Message cannot be empty')
];

module.exports = { handleValidation, loginRules, bookingRules, contactRules };
