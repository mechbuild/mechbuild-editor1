const express = require('express');
const router = express.Router();
const { getMetrics } = require('../utils/metrics');

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const metrics = await getMetrics();
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      metrics: metrics ? 'available' : 'unavailable',
      uptime: process.uptime()
    };
    
    res.json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router; 