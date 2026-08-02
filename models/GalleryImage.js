// models/GalleryImage.js
// A single image in the public gallery, manageable from the admin dashboard.

const mongoose = require('mongoose');

const galleryImageSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    category: {
      type: String,
      enum: ['Makeup', 'Hairstyle', 'Bridal', 'Before & After'],
      required: true
    },
    imageUrl: { type: String, required: true },
    displayOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('GalleryImage', galleryImageSchema);
