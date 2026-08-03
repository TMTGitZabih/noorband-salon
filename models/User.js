// models/User.js
// Shared account model for both Admin and Artist logins.
// Artist-specific profile data lives in models/Artist.js, linked by userId.
//
// NOTE: Passwords are stored in PLAIN TEXT (no hashing). This is a deliberate
// simplification so passwords can be viewed/edited directly in MongoDB
// (e.g. via mongosh or Atlas) without needing to generate a hash first.
// This trades away real security -- do not reuse this pattern for a site
// handling sensitive data. Anyone with database access can read every
// password as-is.

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['admin', 'artist'], required: true },
    phone: { type: String, trim: true },
    profileImage: { type: String, default: '/images/artists/default.svg' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Plain-text comparison. Kept as a method (rather than inlining `===`
// everywhere it's used) so the rest of the app doesn't need to change if
// hashing is ever added back later.
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return Promise.resolve(candidate === this.password);
};

module.exports = mongoose.model('User', userSchema);
