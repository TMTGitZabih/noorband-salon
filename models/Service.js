// models/Service.js
// A bookable service offered by the salon (e.g. Bridal Makeup).

const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'Makeup',
        'Hair Styling',
        'Hair Coloring',
        'Hair Cutting',
        'Facial',
        'Skincare',
        'Eyebrows',
        'Henna',
        'Other'
      ],
      default: 'Other'
    },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, required: true, min: 15 },
    image: { type: String, default: '/images/gallery/placeholder.svg' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
