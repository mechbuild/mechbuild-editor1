const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const User = require('../models/userModel');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Configure upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('profilePicture'); // 'profilePicture' is the field name

// Upload profile picture
exports.uploadProfilePicture = (req, res) => {
  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      logger.error('Multer error:', err);
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    } else if (err) {
      // An unknown error occurred
      logger.error('Upload error:', err);
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Please upload a file'
      });
    }

    // File upload success
    res.status(200).json({
      status: 'success',
      message: 'File uploaded successfully',
      filePath: `/uploads/${req.file.filename}`
    });
  });
};

module.exports = {
  uploadProfilePicture
}; 