// controllers/serviceController.js
const Service = require('../models/Service');

exports.listServices = async (req, res, next) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ category: 1, name: 1 });
    const grouped = services.reduce((acc, service) => {
      acc[service.category] = acc[service.category] || [];
      acc[service.category].push(service);
      return acc;
    }, {});
    res.render('services', { title: 'Our Services', grouped });
  } catch (err) {
    next(err);
  }
};
