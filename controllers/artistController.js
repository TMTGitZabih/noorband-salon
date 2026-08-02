// controllers/artistController.js
const Artist = require('../models/Artist');

exports.listArtists = async (req, res, next) => {
  try {
    const artists = await Artist.find({ isActive: true })
      .populate('user', 'name profileImage')
      .populate('services', 'name');
    res.render('artists', { title: 'Our Artists', artists });
  } catch (err) {
    next(err);
  }
};

exports.showArtist = async (req, res, next) => {
  try {
    const artist = await Artist.findById(req.params.id)
      .populate('user', 'name profileImage')
      .populate('services');
    if (!artist) return res.status(404).render('errors/404', { title: 'Artist not found' });
    res.render('artist-profile', { title: artist.user.name, artist });
  } catch (err) {
    next(err);
  }
};
