import { performanceMonitor } from '../utils/performanceMonitor';
import { jest } from '@jest/globals';
import os from 'os';
import { promisify } from 'util';
import { exec } from 'child_process';

jest.mock('os');
jest.mock('util');
jest.mock('child_process');
jest.mock('../utils/dbOptimizer', () => ({
  dbOptimizer: {
    monitorDatabase: jest.fn()
  }
}));

const execAsync = promisify(exec);

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitor.metrics = {
      system: {},
      application: {},
      database: {},
      alerts: [],
      recommendations: []
    };
    performanceMonitor.history = [];
  });

  describe('System Metrics Collection', () => {
    it('should collect CPU metrics correctly', async () => {
      os.cpus.mockReturnValue([
        { model: 'Test CPU', speed: 2000, times: { user: 100, nice: 0, sys: 50, idle: 850 } }
      ]);
      os.loadavg.mockReturnValue([1.5, 1.2, 1.0]);

      await performanceMonitor.collectSystemMetrics();

      expect(performanceMonitor.metrics.system.cpu).toEqual({
        usage: expect.any(Number),
        cores: 1,
        load: [1.5, 1.2, 1.0]
      });
    });

    it('should collect memory metrics correctly', async () => {
      os.totalmem.mockReturnValue(1000000000);
      os.freemem.mockReturnValue(500000000);

      await performanceMonitor.collectSystemMetrics();

      expect(performanceMonitor.metrics.system.memory).toEqual({
        total: 1000000000,
        free: 500000000,
        usage: expect.any(Number)
      });
    });

    it('should collect disk metrics correctly', async () => {
      execAsync.mockResolvedValue({ stdout: 'Filesystem Size Used Avail Use%\n/dev/sda1 100G 50G 50G 50%' });

      await performanceMonitor.collectSystemMetrics();

      expect(performanceMonitor.metrics.system.disk).toEqual({
        usage: 50
      });
    });
  });

  describe('Application Metrics Collection', () => {
    it('should collect response times', async () => {
      await performanceMonitor.collectApplicationMetrics();

      expect(performanceMonitor.metrics.application.responseTimes).toEqual({
        average: 100,
        p95: 200,
        p99: 500
      });
    });

    it('should collect error rates', async () => {
      await performanceMonitor.collectApplicationMetrics();

      expect(performanceMonitor.metrics.application.errorRates).toEqual({
        total: 0.01,
        byEndpoint: {}
      });
    });

    it('should collect request counts', async () => {
      await performanceMonitor.collectApplicationMetrics();

      expect(performanceMonitor.metrics.application.requestCounts).toEqual({
        total: 1000,
        byEndpoint: {}
      });
    });
  });

  describe('Database Metrics Collection', () => {
    it('should collect database metrics', async () => {
      const mockDbMetrics = {
        queryTime: 100,
        connections: 10,
        cacheHitRate: 0.8
      };
      require('../utils/dbOptimizer').dbOptimizer.monitorDatabase.mockResolvedValue(mockDbMetrics);

      await performanceMonitor.collectDatabaseMetrics();

      expect(performanceMonitor.metrics.database).toEqual(mockDbMetrics);
    });
  });

  describe('Threshold Monitoring', () => {
    it('should generate alerts when CPU usage exceeds threshold', async () => {
      performanceMonitor.metrics.system.cpu = { usage: 85 };
      performanceMonitor.thresholds.cpu = 80;

      performanceMonitor.checkThresholds();

      expect(performanceMonitor.metrics.alerts).toContainEqual({
        type: 'cpu',
        message: 'High CPU usage detected',
        severity: 'warning',
        timestamp: expect.any(Date)
      });
    });

    it('should generate alerts when memory usage exceeds threshold', async () => {
      performanceMonitor.metrics.system.memory = { usage: 85 };
      performanceMonitor.thresholds.memory = 80;

      performanceMonitor.checkThresholds();

      expect(performanceMonitor.metrics.alerts).toContainEqual({
        type: 'memory',
        message: 'High memory usage detected',
        severity: 'warning',
        timestamp: expect.any(Date)
      });
    });

    it('should generate alerts when response time exceeds threshold', async () => {
      performanceMonitor.metrics.application.responseTimes = { p95: 1200 };
      performanceMonitor.thresholds.responseTime = 1000;

      performanceMonitor.checkThresholds();

      expect(performanceMonitor.metrics.alerts).toContainEqual({
        type: 'responseTime',
        message: 'High response time detected',
        severity: 'warning',
        timestamp: expect.any(Date)
      });
    });
  });

  describe('Historical Data', () => {
    it('should store historical metrics', async () => {
      const startTime = new Date();
      await performanceMonitor.collectSystemMetrics();
      await performanceMonitor.collectApplicationMetrics();
      await performanceMonitor.collectDatabaseMetrics();

      const endTime = new Date();
      const historicalMetrics = await performanceMonitor.getHistoricalMetrics(startTime, endTime);

      expect(historicalMetrics).toHaveLength(1);
      expect(historicalMetrics[0]).toHaveProperty('timestamp');
      expect(historicalMetrics[0]).toHaveProperty('system');
      expect(historicalMetrics[0]).toHaveProperty('application');
      expect(historicalMetrics[0]).toHaveProperty('database');
    });

    it('should clean up old metrics', async () => {
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000);
      performanceMonitor.history.push({
        timestamp: oldDate.toISOString(),
        system: {},
        application: {},
        database: {}
      });

      await performanceMonitor.collectSystemMetrics();
      await performanceMonitor.collectApplicationMetrics();
      await performanceMonitor.collectDatabaseMetrics();

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const historicalMetrics = await performanceMonitor.getHistoricalMetrics(oneDayAgo, new Date());

      expect(historicalMetrics).toHaveLength(1);
      expect(new Date(historicalMetrics[0].timestamp)).toBeGreaterThan(oneDayAgo);
    });
  });

  describe('Event Emission', () => {
    it('should emit alert events when thresholds are exceeded', async () => {
      const alertHandler = jest.fn();
      performanceMonitor.on('alert', alertHandler);

      performanceMonitor.metrics.system.cpu = { usage: 85 };
      performanceMonitor.thresholds.cpu = 80;

      performanceMonitor.checkThresholds();

      expect(alertHandler).toHaveBeenCalled();
      expect(alertHandler.mock.calls[0][0]).toContainEqual({
        type: 'cpu',
        message: 'High CPU usage detected',
        severity: 'warning',
        timestamp: expect.any(Date)
      });
    });
  });
}); 