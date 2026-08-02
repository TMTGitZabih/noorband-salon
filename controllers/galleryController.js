// controllers/galleryController.js
const GalleryImage = require('../models/GalleryImage');

exports.showGallery = async (req, res, next) => {
  try {
    const images = await GalleryImage.find().sort({ category: 1, displayOrder: 1 });
    const grouped = images.reduce((acc, img) => {
      acc[img.category] = acc[img.category] || [];
      acc[img.category].push(img);
      return acc;
    }, {});
    res.render('gallery', { title: 'Gallery', grouped });
  } catch (err) {
    next(err);
  }
};
