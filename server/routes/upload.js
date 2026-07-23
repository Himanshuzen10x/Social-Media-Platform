const express = require('express');
const { cloudinary, upload } = require('../config/cloudinary');
const auth = require('../middleware/auth');
const router = express.Router();

// Upload single image with NSFW moderation
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Upload to Cloudinary with AWS Rekognition moderation
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'social-media',
          moderation: 'aws_rek',
          transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    // Check moderation result
    if (result.moderation && result.moderation.length > 0) {
      const modResult = result.moderation[0];
      if (modResult.status === 'rejected') {
        // Delete the rejected image from Cloudinary
        await cloudinary.uploader.destroy(result.public_id);
        return res.status(400).json({
          message: '🚫 This image contains inappropriate content and cannot be uploaded.'
        });
      }
    }

    res.json({
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
