// controllers/authController.js
// Handles login/logout for both Admin and Artist roles. There is no public
// signup: admins create artist accounts from the Admin Dashboard.

const User = require('../models/User');

exports.showLogin = (req, res) => {
  res.render('login', { title: 'Login', error: null });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.isActive) {
      return res.status(401).render('login', { title: 'Login', error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).render('login', { title: 'Login', error: 'Invalid email or password' });
    }

    req.session.userId = user._id.toString();
    req.session.role = user.role;
    req.session.name = user.name;

    const redirectTo =
      req.session.returnTo || (user.role === 'admin' ? '/admin/dashboard' : '/artist/dashboard');
    delete req.session.returnTo;

    res.redirect(redirectTo);
  } catch (err) {
    console.error(err);
    res.status(500).render('login', { title: 'Login', error: 'Something went wrong. Please try again.' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};