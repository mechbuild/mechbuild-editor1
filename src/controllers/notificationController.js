const Notification = require('../models/Notification');
const ErrorService = require('../services/errorService');

const notificationController = {
  // Get all notifications for the current user
  async getNotifications(req, res) {
    try {
      const notifications = await Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 });
      res.json(notifications);
    } catch (error) {
      const errorResponse = await ErrorService.handle(error, 'Get Notifications');
      res.status(errorResponse.status).json({ message: errorResponse.message });
    }
  },

  // Create a new notification
  async createNotification(req, res) {
    try {
      const { title, message, type, frequency, date } = req.body;
      
      const notification = new Notification({
        title,
        message,
        type,
        frequency,
        date: frequency === 'custom' ? new Date(date) : null,
        userId: req.user._id
      });

      await notification.save();
      res.status(201).json(notification);
    } catch (error) {
      const errorResponse = await ErrorService.handle(error, 'Create Notification');
      res.status(errorResponse.status).json({ message: errorResponse.message });
    }
  },

  // Delete a notification
  async deleteNotification(req, res) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id
      });

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
      const errorResponse = await ErrorService.handle(error, 'Delete Notification');
      res.status(errorResponse.status).json({ message: errorResponse.message });
    }
  }
};

module.exports = notificationController; 