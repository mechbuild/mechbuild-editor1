const express = require('express');
const router = express.Router();

// Import route modules
const notificationRoutes = require('./notificationRoutes');
const userRoutes = require('./userRoutes');
const projectRoutes = require('./projectRoutes');

// Use routes
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);

module.exports = router; 