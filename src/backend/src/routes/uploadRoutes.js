const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadProfilePicture } = require('../controllers/uploadController');

// Protected route for uploading profile picture
router.post('/profile-picture', protect, uploadProfilePicture);

module.exports = router; 