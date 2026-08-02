// server.js
// Application entry point: wires together config, middleware, routes, and
// starts the HTTP server.

require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');

const connectDB = require('./config/db');
const { loadSettings } = require('./middleware/loadSettings');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const pageRoutes = require('./routes/pageRoutes');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const artistDashboardRoutes = require('./routes/artistDashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

connectDB();

// ----- View engine -----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// ----- Core middleware -----
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(methodOverride((req) => {
  // Allow AJAX calls to send a real DELETE via fetch(), and HTML forms to
  // fall back to a hidden _method field.
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    const method = req.body._method;
    delete req.body._method;
    return method;
  }
}));
app.use(express.static(path.join(__dirname, 'public')));

// ----- Sessions -----
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_only_insecure_secret_change_me',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    }
  })
);

// Make session/user info available to every view.
app.use((req, res, next) => {
  res.locals.currentUser = req.session.userId
    ? { id: req.session.userId, name: req.session.name, role: req.session.role }
    : null;
  next();
});

// Loads salon contact info / opening hours into res.locals.salon.
app.use(loadSettings);

// ----- Routes -----
app.use('/', pageRoutes);
app.use('/', authRoutes);
app.use('/', bookingRoutes);
app.use('/artist', artistDashboardRoutes);
app.use('/admin', adminRoutes);

// ----- Error handling (must be last) -----
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`NoorBand Salon server running on port ${PORT}`);
});
