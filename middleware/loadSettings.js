// middleware/loadSettings.js
// Runs on every request. Loads the (cached) salon settings singleton and
// exposes it to every EJS view as `salon`, so pages never need to remember
// to pass it in manually.

const Setting = require('../models/Setting');

let cache = null;
let cacheExpiresAt = 0;

async function loadSettings(req, res, next) {
  try {
    if (!cache || Date.now() > cacheExpiresAt) {
      cache = await Setting.getSingleton();
      cacheExpiresAt = Date.now() + 30 * 1000; // 30s cache to avoid a query per request
    }
    res.locals.salon = cache;
    next();
  } catch (err) {
    next(err);
  }
}

// Call after any admin update so the new values show immediately.
function invalidateSettingsCache() {
  cache = null;
}

module.exports = { loadSettings, invalidateSettingsCache };
