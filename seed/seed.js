// seed/seed.js
// Populates a fresh database with an admin account, a couple of sample
// artists, and sample services so the site isn't empty on first run.
//
// Usage:  npm run seed
// (requires MONGODB_URI to be set in .env)

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Artist = require('../models/Artist');
const Service = require('../models/Service');
const Setting = require('../models/Setting');

async function run() {
  await connectDB();

  // ----- Admin account -----
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@noorbandsalon.online').toLowerCase();
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: process.env.ADMIN_NAME || 'Salon Admin',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
      role: 'admin',
      phone: process.env.ADMIN_PHONE || ''
    });
    console.log(`Created admin account: ${adminEmail}`);
  } else {
    console.log('Admin account already exists, skipping.');
  }

  // ----- Sample services -----
  const serviceDefs = [
    { name: 'Bridal Makeup', category: 'Makeup', price: 250, durationMinutes: 120, description: 'Full bridal makeup with trial session.' },
    { name: 'Party Makeup', category: 'Makeup', price: 80, durationMinutes: 60, description: 'Glam makeup for events and parties.' },
    { name: 'Hair Styling', category: 'Hair Styling', price: 60, durationMinutes: 45, description: 'Blowout, curls, or updo styling.' },
    { name: 'Hair Coloring', category: 'Hair Coloring', price: 120, durationMinutes: 120, description: 'Full color or balayage.' },
    { name: 'Hair Cutting', category: 'Hair Cutting', price: 45, durationMinutes: 45, description: 'Precision cut and finish.' },
    { name: 'Facial', category: 'Facial', price: 70, durationMinutes: 60, description: 'Deep-cleansing rejuvenating facial.' },
    { name: 'Eyebrow Shaping', category: 'Eyebrows', price: 25, durationMinutes: 20, description: 'Threading or waxing and tinting.' },
    { name: 'Bridal Henna', category: 'Henna', price: 100, durationMinutes: 90, description: 'Intricate bridal henna design.' }
  ];

  const existingServiceCount = await Service.countDocuments();
  let services = [];
  if (existingServiceCount === 0) {
    services = await Service.insertMany(serviceDefs);
    console.log(`Created ${services.length} sample services.`);
  } else {
    services = await Service.find();
    console.log('Services already exist, skipping.');
  }

  // ----- Sample artists -----
  const artistDefs = [
    {
      name: 'Layla Hassan',
      email: 'layla@noorbandsalon.online',
      bio: 'Specializing in bridal transformations with over 8 years of experience.',
      experienceYears: 8,
      specialties: ['Bridal Makeup', 'Party Makeup']
    },
    {
      name: 'Sara Ahmed',
      email: 'sara@noorbandsalon.online',
      bio: 'Hair styling expert known for modern cuts and vibrant color work.',
      experienceYears: 5,
      specialties: ['Hair Styling', 'Hair Coloring', 'Hair Cutting']
    }
  ];

  for (const def of artistDefs) {
    const existingUser = await User.findOne({ email: def.email });
    if (existingUser) {
      console.log(`Artist ${def.email} already exists, skipping.`);
      continue;
    }

    const user = await User.create({
      name: def.name,
      email: def.email,
      password: 'ChangeMe123!',
      role: 'artist',
      phone: ''
    });

    const matchedServices = services
      .filter((s) => def.specialties.includes(s.name))
      .map((s) => s._id);

    await Artist.create({
      user: user._id,
      bio: def.bio,
      experienceYears: def.experienceYears,
      specialties: def.specialties,
      services: matchedServices
    });

    console.log(`Created artist: ${def.email} (temp password: ChangeMe123!)`);
  }

  // ----- Settings singleton -----
  await Setting.getSingleton();
  console.log('Salon settings initialized.');

  console.log('\nSeed complete.');
  console.log(`Admin login: ${adminEmail} / ${process.env.ADMIN_PASSWORD || 'ChangeMe123!'}`);
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
