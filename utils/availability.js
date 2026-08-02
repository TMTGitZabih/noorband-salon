// utils/availability.js
// Computes which time slots an artist has free on a given date, based on
// their working hours for that weekday and their existing bookings.

const Booking = require('../models/Booking');

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(minutes) {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

// Returns an array of "HH:MM" strings the artist is free at, for the given
// YYYY-MM-DD date, given the requested service's duration.
async function getAvailableSlots(artist, dateStr, durationMinutes) {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return [];

  const dayName = DAY_NAMES[date.getDay()];
  const daySchedule = artist.workingHours.find((w) => w.day === dayName);
  if (!daySchedule || !daySchedule.isWorking) return [];

  const startMin = toMinutes(daySchedule.startTime);
  const endMin = toMinutes(daySchedule.endTime);
  const step = artist.slotDurationMinutes || 60;

  // Build every candidate slot start time for the day.
  const candidateSlots = [];
  for (let t = startMin; t + durationMinutes <= endMin; t += step) {
    candidateSlots.push(toHHMM(t));
  }

  // Existing bookings that block the day: confirmed/completed always block,
  // and pending-verification bookings block only while their OTP hold is
  // still valid (not older than 10 minutes) so abandoned holds free up.
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const existing = await Booking.find({
    artist: artist._id,
    date: dateStr,
    status: { $in: ['confirmed', 'completed', 'pending_verification'] },
    $or: [{ status: { $in: ['confirmed', 'completed'] } }, { createdAt: { $gte: tenMinutesAgo } }]
  }).select('time');

  const takenTimes = new Set(existing.map((b) => b.time));

  return candidateSlots.filter((slot) => !takenTimes.has(slot));
}

module.exports = { getAvailableSlots, DAY_NAMES };
