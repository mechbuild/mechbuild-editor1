const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Get all notifications
router.get('/', notificationController.getAllNotifications);

// Get notification by ID
router.get('/:id', notificationController.getNotificationById);

// Create new notification
router.post('/', notificationController.createNotification);

// Update notification
router.put('/:id', notificationController.updateNotification);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router; 