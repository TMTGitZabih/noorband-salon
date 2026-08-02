// config/salon.js
// Central place for salon business info, pulled from environment variables
// so the admin can update them without touching code (see Admin > Settings).

module.exports = {
  name: process.env.SALON_NAME || 'NoorBand Salon',
  phone: process.env.SALON_PHONE || '',
  whatsapp: process.env.SALON_WHATSAPP || '',
  email: process.env.SALON_EMAIL || '',
  address: process.env.SALON_ADDRESS || '',
  social: {
    instagram: process.env.SALON_INSTAGRAM || '#',
    facebook: process.env.SALON_FACEBOOK || '#',
    tiktok: process.env.SALON_TIKTOK || '#'
  },
  openingHours: [
    { day: 'Monday', hours: '10:00 AM - 8:00 PM' },
    { day: 'Tuesday', hours: '10:00 AM - 8:00 PM' },
    { day: 'Wednesday', hours: '10:00 AM - 8:00 PM' },
    { day: 'Thursday', hours: '10:00 AM - 8:00 PM' },
    { day: 'Friday', hours: '10:00 AM - 9:00 PM' },
    { day: 'Saturday', hours: '10:00 AM - 9:00 PM' },
    { day: 'Sunday', hours: 'Closed' }
  ]
};
