const express = require('express');
const { cloudinary, upload } = require('../config/cloudinary');
const auth = require('../middleware/auth');
const router = express.Router();

// Upload single image buffer to Cloudinary
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Upload memory buffer to Cloudinary stream
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'socialapp',
          transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    res.json({
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Image upload failed' });
  }
});

module.exports = router;
