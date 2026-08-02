// models/Setting.js
// Singleton document holding editable salon info (contact details, opening
// hours). Lets the admin manage this content from the dashboard instead of
// requiring a redeploy to change a phone number.

const mongoose = require('mongoose');

const openingHourSchema = new mongoose.Schema(
  { day: { type: String, required: true }, hours: { type: String, required: true } },
  { _id: false }
);

const settingSchema = new mongoose.Schema({
  name: { type: String, default: 'NoorBand Salon' },
  phone: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  instagram: { type: String, default: '#' },
  facebook: { type: String, default: '#' },
  tiktok: { type: String, default: '#' },
  openingHours: { type: [openingHourSchema], default: [] }
});

// Always operate on the single settings document (create it if missing).
settingSchema.statics.getSingleton = async function getSingleton() {
  let settings = await this.findOne();
  if (!settings) {
    const defaults = require('../config/salon');
    settings = await this.create({
      name: defaults.name,
      phone: defaults.phone,
      whatsapp: defaults.whatsapp,
      email: defaults.email,
      address: defaults.address,
      instagram: defaults.social.instagram,
      facebook: defaults.social.facebook,
      tiktok: defaults.social.tiktok,
      openingHours: defaults.openingHours
    });
  }
  return settings;
};

module.exports = mongoose.model('Setting', settingSchema);
