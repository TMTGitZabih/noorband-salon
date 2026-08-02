// middleware/errorHandler.js
// Centralized 404 + error handling so every route benefits from consistent,
// safe error pages (no stack traces leaked in production).

function notFound(req, res) {
  res.status(404).render('errors/404', { title: 'Page not found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err.stack || err);
  const status = err.status || 500;
  res.status(status).render('errors/500', {
    title: 'Something went wrong',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong. Please try again.' : err.message
  });
}

module.exports = { notFound, errorHandler };
