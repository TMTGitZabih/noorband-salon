// models/Artist.js
// Public-facing artist profile. One-to-one with a User whose role is "artist".

const mongoose = require('mongoose');

const workingHoursSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true
    },
    isWorking: { type: Boolean, default: true },
    startTime: { type: String, default: '10:00' }, // 24h "HH:MM"
    endTime: { type: String, default: '18:00' }
  },
  { _id: false }
);

const artistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bio: { type: String, default: '' },
    experienceYears: { type: Number, default: 0 },
    specialties: [{ type: String, trim: true }],
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
    workingHours: {
      type: [workingHoursSchema],
      default: () => [
        { day: 'Sunday', isWorking: false, startTime: '10:00', endTime: '18:00' },
        { day: 'Monday', isWorking: true, startTime: '10:00', endTime: '18:00' },
        { day: 'Tuesday', isWorking: true, startTime: '10:00', endTime: '18:00' },
        { day: 'Wednesday', isWorking: true, startTime: '10:00', endTime: '18:00' },
        { day: 'Thursday', isWorking: true, startTime: '10:00', endTime: '18:00' },
        { day: 'Friday', isWorking: true, startTime: '10:00', endTime: '19:00' },
        { day: 'Saturday', isWorking: true, startTime: '10:00', endTime: '19:00' }
      ]
    },
    slotDurationMinutes: { type: Number, default: 60 },
    socialLinks: {
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
      tiktok: { type: String, default: '' }
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Artist', artistSchema);
