const express = require('express');
const router = express.Router();
const { performanceMonitor } = require('../utils/performanceMonitor');
const { systemMetrics } = require('../utils/systemMetrics');
const { requestMonitor } = require('../utils/requestMonitor');
const { databaseMonitor } = require('../utils/databaseMonitor');

// Get overall system metrics
router.get('/metrics', (req, res) => {
  try {
    const systemInfo = systemMetrics.getSystemInfo();
    const currentMetrics = systemMetrics.collectMetrics();
    const requestStats = requestMonitor.getRequestStats();
    const dbStats = databaseMonitor.getQueryStats();

    const metrics = {
      system: {
        ...systemInfo,
        currentMetrics
      },
      requests: requestStats,
      database: dbStats,
      performance: {
        cpu: performanceMonitor.getMetricsInRange('cpu', Date.now() - 3600000, Date.now()),
        memory: performanceMonitor.getMetricsInRange('memory', Date.now() - 3600000, Date.now()),
        responseTime: performanceMonitor.getMetricsInRange('responseTime', Date.now() - 3600000, Date.now()),
        errorRate: performanceMonitor.getMetricsInRange('errorRate', Date.now() - 3600000, Date.now())
      },
      alerts: performanceMonitor.getMetricsInRange('alerts', Date.now() - 3600000, Date.now())
    };

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to collect monitoring data' });
  }
});

// Get active requests
router.get('/requests/active', (req, res) => {
  try {
    const activeRequests = requestMonitor.getActiveRequests();
    res.json(activeRequests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get active requests' });
  }
});

// Get database queries
router.get('/database/queries', (req, res) => {
  try {
    const activeQueries = databaseMonitor.getActiveQueries();
    res.json(activeQueries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get database queries' });
  }
});

// Get error logs
router.get('/errors', (req, res) => {
  try {
    const { startTime = Date.now() - 3600000, endTime = Date.now() } = req.query;
    const errors = performanceMonitor.getMetricsInRange('errorRate', parseInt(startTime), parseInt(endTime));
    res.json(errors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get error logs' });
  }
});

// Get performance report
router.get('/performance', (req, res) => {
  try {
    const { startTime = Date.now() - 3600000, endTime = Date.now() } = req.query;
    const report = performanceMonitor.generateReport({
      startTime: parseInt(startTime),
      endTime: parseInt(endTime)
    });
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate performance report' });
  }
});

module.exports = router; 