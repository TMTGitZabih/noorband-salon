// routes/authRoutes.js
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { redirectIfAuthenticated } = require('../middleware/auth');
const { loginRules } = require('../middleware/validators');
const { validationResult } = require('express-validator');

router.get('/login', redirectIfAuthenticated, authController.showLogin);

router.post('/login', redirectIfAuthenticated, loginRules, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('login', { title: 'Login', error: errors.array()[0].msg });
  }
  next();
}, authController.login);

router.post('/logout', authController.logout);

module.exports = router;
