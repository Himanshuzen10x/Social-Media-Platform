const express = require('express');
const { cloudinary, upload } = require('../config/cloudinary');
const auth = require('../middleware/auth');
const router = express.Router();

// Upload single image buffer to Cloudinary with AWS Rekognition NSFW Moderation
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Upload memory buffer to Cloudinary stream with AWS Rekognition moderation
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'socialapp',
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

    // Check AWS Rekognition moderation status
    if (result.moderation && result.moderation.length > 0) {
      const modResult = result.moderation[0];
      if (modResult.status === 'rejected') {
        // Delete rejected image from Cloudinary
        try {
          await cloudinary.uploader.destroy(result.public_id);
        } catch (e) {
          // ignore cleanup error
        }
        return res.status(400).json({
          message: '🚫 Image contains inappropriate content (NSFW) and was rejected by AWS Rekognition moderation.'
        });
      }
    }

    res.json({
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Image upload/moderation failed' });
  }
});

module.exports = router;
