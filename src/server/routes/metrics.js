import express from 'express';
import { getMetrics } from '../utils/metrics';
import { performanceMonitor } from '../utils/performanceMonitor';
import dbOptimizer from '../utils/dbOptimizer';

const router = express.Router();

// Get real-time metrics
router.get('/realtime', async (req, res) => {
  try {
    const metrics = await getMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching real-time metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Get historical metrics
router.get('/historical', async (req, res) => {
  try {
    const { startTime, endTime } = req.query;
    const metrics = await performanceMonitor.getHistoricalMetrics(
      new Date(startTime),
      new Date(endTime)
    );
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching historical metrics:', error);
    res.status(500).json({ error: 'Failed to fetch historical metrics' });
  }
});

// Get alerts
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await performanceMonitor.getAlerts();
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const recommendations = await performanceMonitor.getRecommendations();
    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Performance report endpoint
router.get('/report', async (req, res) => {
  try {
    const report = await performanceMonitor.generateReport();
    res.json(report);
  } catch (error) {
    console.error('Error generating performance report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Database optimization recommendations
router.get('/database/recommendations', async (req, res) => {
  try {
    const dbStats = await dbOptimizer.getQueryStats();
    const recommendations = [];

    // Check for slow queries
    if (dbStats.slowQueries > 0) {
      recommendations.push({
        type: 'query_optimization',
        priority: 'high',
        description: `${dbStats.slowQueries} slow queries detected`,
        action: 'Review and optimize slow queries'
      });
    }

    // Check cache hit rate
    const cacheHitRate = dbStats.cachedQueries / dbStats.totalQueries;
    if (cacheHitRate < 0.5) {
      recommendations.push({
        type: 'caching',
        priority: 'medium',
        description: `Low cache hit rate: ${(cacheHitRate * 100).toFixed(2)}%`,
        action: 'Consider implementing additional caching strategies'
      });
    }

    res.json({
      timestamp: new Date().toISOString(),
      recommendations
    });
  } catch (error) {
    console.error('Error generating database recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// System health check
router.get('/health', async (req, res) => {
  try {
    const [systemMetrics, dbMetrics] = await Promise.all([
      performanceMonitor.collectSystemMetrics(),
      dbOptimizer.monitorDatabase()
    ]);

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        cpu: systemMetrics.cpu.load < 80,
        memory: systemMetrics.memory.usage < 90,
        disk: systemMetrics.disk.free > 1024 * 1024 * 1024, // 1GB
        database: dbMetrics.activeConnections < 50
      }
    };

    // Update status if any check fails
    if (Object.values(health.checks).some(check => !check)) {
      health.status = 'degraded';
    }

    res.json(health);
  } catch (error) {
    console.error('Error performing health check:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: 'Failed to perform health check'
    });
  }
});

export default router; 