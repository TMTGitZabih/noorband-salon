// controllers/pageController.js
// Simple content pages: Home, About, Contact (form submit), and error pages
// share this controller since they don't need their own file.

const Artist = require('../models/Artist');
const Service = require('../models/Service');
// Note: salon contact/hours info is provided to every view automatically by
// middleware/loadSettings.js (res.locals.salon), so it is not passed here.

exports.home = async (req, res, next) => {
  try {
    const [featuredServices, featuredArtists] = await Promise.all([
      Service.find({ isActive: true }).sort({ createdAt: -1 }).limit(6),
      Artist.find({ isActive: true }).populate('user', 'name profileImage').limit(4)
    ]);

    const testimonials = [
      {
        name: 'Amina R.',
        text: 'NoorBand Salon made my bridal look absolutely stunning. Booking online was so easy!',
        rating: 5
      },
      {
        name: 'Sara K.',
        text: 'Professional artists, clean space, and the WhatsApp confirmation gave me peace of mind.',
        rating: 5
      },
      {
        name: 'Layla M.',
        text: 'My go-to salon for every occasion. The hair styling team is incredibly talented.',
        rating: 5
      }
    ];

    res.render('home', {
      title: 'Home',
      featuredServices,
      featuredArtists,
      testimonials
    });
  } catch (err) {
    next(err);
  }
};

exports.about = (req, res) => {
  res.render('about', { title: 'About Us' });
};

exports.contactPage = (req, res) => {
  res.render('contact', { title: 'Contact Us', success: null, error: null });
};

exports.submitContact = (req, res) => {
  // A full implementation would email/store this. For now we log it and
  // acknowledge receipt -- wire up nodemailer or a Google Form here later.
  const { name, email, message } = req.body;
  console.log('New contact message:', { name, email, message });
  res.render('contact', {
    title: 'Contact Us',
    success: 'Thank you! Your message has been received. We will get back to you soon.',
    error: null
  });
};
