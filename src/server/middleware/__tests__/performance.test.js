const request = require('supertest');
const express = require('express');
const {
  responseTimeMiddleware,
  compressionMiddleware,
  cacheMiddleware,
  queryOptimization,
  resourceOptimization,
  memoryMonitor
} = require('../performance');
const logger = require('../../utils/logger');
const metrics = require('../../utils/metrics');

// Mock logger and metrics
jest.mock('../../utils/logger', () => ({
  debug: jest.fn(),
  warn: jest.fn()
}));

jest.mock('../../utils/metrics', () => ({
  histogram: jest.fn(),
  increment: jest.fn(),
  gauge: jest.fn()
}));

describe('Performance Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    jest.clearAllMocks();
  });

  describe('Response Time Middleware', () => {
    it('should measure and log response time', async () => {
      app.use(responseTimeMiddleware);
      app.get('/test', (req, res) => res.json({ message: 'success' }));

      await request(app).get('/test');

      expect(metrics.histogram).toHaveBeenCalledWith(
        'http_response_time',
        expect.any(Number)
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'Request completed',
        expect.objectContaining({
          method: 'GET',
          path: '/test',
          duration: expect.any(Number)
        })
      );
    });
  });

  describe('Compression Middleware', () => {
    it('should compress responses', async () => {
      app.use(compressionMiddleware);
      app.get('/test', (req, res) => res.json({ message: 'success' }));

      const response = await request(app)
        .get('/test')
        .set('Accept-Encoding', 'gzip');

      expect(response.headers['content-encoding']).toBe('gzip');
    });

    it('should not compress when x-no-compression header is present', async () => {
      app.use(compressionMiddleware);
      app.get('/test', (req, res) => res.json({ message: 'success' }));

      const response = await request(app)
        .get('/test')
        .set('x-no-compression', 'true')
        .set('Accept-Encoding', 'gzip');

      expect(response.headers['content-encoding']).toBeUndefined();
    });
  });

  describe('Cache Middleware', () => {
    it('should cache responses', async () => {
      const cacheDuration = 60; // 1 minute
      app.use(cacheMiddleware(cacheDuration));
      app.get('/test', (req, res) => res.json({ message: 'success' }));

      // First request
      await request(app).get('/test');
      expect(metrics.increment).toHaveBeenCalledWith('cache.misses');

      // Second request (should be cached)
      await request(app).get('/test');
      expect(metrics.increment).toHaveBeenCalledWith('cache.hits');
    });
  });

  describe('Query Optimization', () => {
    it('should limit number of query parameters', async () => {
      app.use(queryOptimization);
      app.get('/test', (req, res) => res.json(req.query));

      const queryParams = {};
      for (let i = 0; i < 11; i++) {
        queryParams[`param${i}`] = 'value';
      }

      const response = await request(app)
        .get('/test')
        .query(queryParams);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Too many query parameters');
    });

    it('should sanitize query parameters', async () => {
      app.use(queryOptimization);
      app.get('/test', (req, res) => res.json(req.query));

      const response = await request(app)
        .get('/test')
        .query({
          'veryLongParameterNameThatExceedsTheLimit': 'value',
          'normalParam': 'veryLongValueThatShouldBeTruncated'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        normalParam: 'veryLongValueThatShouldBeTruncated'
      });
    });
  });

  describe('Resource Optimization', () => {
    it('should set appropriate cache headers', async () => {
      app.use(resourceOptimization);
      app.get('/test', (req, res) => res.json({ message: 'success' }));

      const response = await request(app).get('/test');

      expect(response.headers['cache-control']).toBe('public, max-age=31536000');
      expect(response.headers['vary']).toBe('Accept-Encoding');
      expect(response.headers['connection']).toBe('keep-alive');
      expect(response.headers['keep-alive']).toBe('timeout=5, max=1000');
    });
  });

  describe('Memory Monitor', () => {
    it('should monitor memory usage', async () => {
      app.use(memoryMonitor);
      app.get('/test', (req, res) => res.json({ message: 'success' }));

      await request(app).get('/test');

      expect(metrics.gauge).toHaveBeenCalledWith('memory.heap_used', expect.any(Number));
      expect(metrics.gauge).toHaveBeenCalledWith('memory.heap_total', expect.any(Number));
      expect(metrics.gauge).toHaveBeenCalledWith('memory.external', expect.any(Number));
    });

    it('should log warning for high memory usage', async () => {
      // Mock process.memoryUsage to simulate high memory usage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = () => ({
        heapUsed: 100 * 1024 * 1024, // 100MB
        heapTotal: 200 * 1024 * 1024,
        external: 50 * 1024 * 1024
      });

      app.use(memoryMonitor);
      app.get('/test', (req, res) => res.json({ message: 'success' }));

      await request(app).get('/test');

      expect(logger.warn).toHaveBeenCalledWith(
        'High memory usage detected',
        expect.objectContaining({
          path: '/test',
          memoryDiff: expect.any(Object)
        })
      );

      // Restore original memoryUsage
      process.memoryUsage = originalMemoryUsage;
    });
  });
}); 