// controllers/authController.js
const User = require('../models/User');

exports.showLogin = (req, res) => {
  res.render('login', { title: 'Login', error: null });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const lookupEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: lookupEmail });

    console.log('[LOGIN DEBUG] submitted email:', JSON.stringify(email));
    console.log('[LOGIN DEBUG] looked up as:', JSON.stringify(lookupEmail));
    console.log('[LOGIN DEBUG] user found:', !!user);
    if (user) {
      console.log('[LOGIN DEBUG] submitted password:', JSON.stringify(password));
      console.log('[LOGIN DEBUG] stored password:', JSON.stringify(user.password));
    }

    if (!user || !user.isActive) {
      return res.status(401).render('login', { title: 'Login', error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    console.log('[LOGIN DEBUG] isMatch:', isMatch);
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