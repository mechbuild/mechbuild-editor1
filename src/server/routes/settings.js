const express = require('express');
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// Get user settings/profile
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Update user settings/profile
router.put('/', verifyToken, async (req, res, next) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    res.json(user);
  } catch (err) {
    next(err);
  }
});

module.exports = router; 