// middleware/auth.js
// Route guards for session-based authentication and role-based authorization.

// Requires any logged-in user (admin or artist).
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  req.session.returnTo = req.originalUrl;
  return res.redirect('/login');
}

// Requires the logged-in user to have the "admin" role.
function requireAdmin(req, res, next) {
  if (req.session && req.session.role === 'admin') return next();
  return res.status(403).render('errors/403', { title: 'Access denied' });
}

// Requires the logged-in user to have the "artist" role.
function requireArtist(req, res, next) {
  if (req.session && req.session.role === 'artist') return next();
  return res.status(403).render('errors/403', { title: 'Access denied' });
}

// Redirects an already-logged-in user away from the login page.
function redirectIfAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return res.redirect(req.session.role === 'admin' ? '/admin/dashboard' : '/artist/dashboard');
  }
  next();
}

module.exports = { requireAuth, requireAdmin, requireArtist, redirectIfAuthenticated };
