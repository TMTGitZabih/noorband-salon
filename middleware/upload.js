// middleware/upload.js
// Multer config for gallery image uploads. Stores files locally under
// public/images/uploads. NOTE: Render's free/standard disks are NOT
// persistent across deploys -- for production, swap this out for a cloud
// storage bucket (e.g. Cloudinary, S3) and store the returned URL instead.

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'images', 'uploads'));
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

function fileFilter(req, file, cb) {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
    return cb(null, true);
  }
  cb(new Error('Only .jpg, .jpeg, .png and .webp images are allowed.'));
}

module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
