// routes/pageRoutes.js
const express = require('express');
const router = express.Router();

const pageController = require('../controllers/pageController');
const serviceController = require('../controllers/serviceController');
const artistController = require('../controllers/artistController');
const galleryController = require('../controllers/galleryController');
const { contactRules } = require('../middleware/validators');
const { validationResult } = require('express-validator');

router.get('/', pageController.home);
router.get('/about', pageController.about);
router.get('/services', serviceController.listServices);
router.get('/artists', artistController.listArtists);
router.get('/artists/:id', artistController.showArtist);
router.get('/gallery', galleryController.showGallery);

router.get('/contact', pageController.contactPage);
router.post(
  '/contact',
  contactRules,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('contact', {
        title: 'Contact Us',
        success: null,
        error: errors.array()[0].msg
      });
    }
    next();
  },
  pageController.submitContact
);

module.exports = router;
