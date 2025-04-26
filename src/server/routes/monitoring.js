const express = require('express');
const router = express.Router();
const { requestMonitor } = require('../utils/requestMonitor');
const { logger } = require('../utils/logger');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Get request statistics
router.get('/stats', verifyToken, isAdmin, (req, res) => {
  try {
    const stats = requestMonitor.getRequestStats();
    logger.info('Request statistics retrieved');
    res.json(stats);
  } catch (error) {
    logger.error('Error retrieving request statistics', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve request statistics' });
  }
});

// Get active requests
router.get('/active', verifyToken, isAdmin, (req, res) => {
  try {
    const activeRequests = requestMonitor.getAllRequests()
      .filter(request => request.status === 'pending');
    logger.info('Active requests retrieved');
    res.json(activeRequests);
  } catch (error) {
    logger.error('Error retrieving active requests', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve active requests' });
  }
});

// Get request details by ID
router.get('/requests/:requestId', verifyToken, isAdmin, (req, res) => {
  try {
    const requestDetails = requestMonitor.getRequestDetails(req.params.requestId);
    if (!requestDetails) {
      logger.warn('Request not found', { requestId: req.params.requestId });
      return res.status(404).json({ error: 'Request not found' });
    }
    logger.info('Request details retrieved', { requestId: req.params.requestId });
    res.json(requestDetails);
  } catch (error) {
    logger.error('Error retrieving request details', { 
      error: error.message,
      requestId: req.params.requestId
    });
    res.status(500).json({ error: 'Failed to retrieve request details' });
  }
});

// Get recent requests
router.get('/recent', verifyToken, isAdmin, (req, res) => {
  try {
    const recentRequests = requestMonitor.getAllRequests()
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, 50); // Get last 50 requests
    logger.info('Recent requests retrieved');
    res.json(recentRequests);
  } catch (error) {
    logger.error('Error retrieving recent requests', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve recent requests' });
  }
});

// Reset monitoring data
router.post('/reset', verifyToken, isAdmin, (req, res) => {
  try {
    requestMonitor.reset();
    logger.info('Monitoring data reset');
    res.json({ message: 'Monitoring data reset successfully' });
  } catch (error) {
    logger.error('Error resetting monitoring data', { error: error.message });
    res.status(500).json({ error: 'Failed to reset monitoring data' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Metrics (dummy example)
router.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 