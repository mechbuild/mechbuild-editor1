const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authController = require('../controllers/authController');

// Protect all routes
router.use(authController.protect);

// Send message
router.post('/messages', chatController.sendMessage);

// Get messages with a user
router.get('/messages/:userId', chatController.getMessages);

module.exports = router; 