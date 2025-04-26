const request = require('supertest');
const app = require('../app');
const { performance } = require('perf_hooks');
const { pool } = require('../config/database');
const { createToken } = require('../utils/auth');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

describe('Performance Tests', () => {
  let validToken;
  const testFile = 'test/files/large.xlsx';
  const PERFORMANCE_THRESHOLDS = {
    API_RESPONSE_TIME: 200, // ms
    FILE_UPLOAD_TIME: 3000, // ms
    CONCURRENT_REQUESTS: 20,
    CONCURRENT_UPLOADS: 10,
    MEMORY_INCREASE: 5 * 1024 * 1024, // 5MB
    DB_QUERY_TIME: 100, // ms
    CACHE_IMPROVEMENT: 0.5 // 50% improvement
  };

  beforeAll(async () => {
    validToken = createToken({ userId: 'test-user' });
    // Warm up the application
    await request(app).get('/api/status');
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Response Time Tests', () => {
    test('API status endpoint should respond within threshold', async () => {
      const start = performance.now();
      
      const response = await request(app)
        .get('/api/status')
        .set('Authorization', `Bearer ${validToken}`);

      const end = performance.now();
      const responseTime = end - start;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
    });

    test('File upload should complete within threshold', async () => {
      const start = performance.now();
      
      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', testFile);

      const end = performance.now();
      const uploadTime = end - start;

      expect(response.status).toBe(200);
      expect(uploadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FILE_UPLOAD_TIME);
    });
  });

  describe('Concurrency Tests', () => {
    test(`should handle ${PERFORMANCE_THRESHOLDS.CONCURRENT_REQUESTS} concurrent requests`, async () => {
      const requests = Array(PERFORMANCE_THRESHOLDS.CONCURRENT_REQUESTS).fill().map(() => 
        request(app)
          .get('/api/status')
          .set('Authorization', `Bearer ${validToken}`)
      );

      const start = performance.now();
      const responses = await Promise.all(requests);
      const end = performance.now();
      const totalTime = end - start;

      expect(responses.every(r => r.status === 200)).toBe(true);
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME * 2);
    });

    test(`should handle ${PERFORMANCE_THRESHOLDS.CONCURRENT_UPLOADS} concurrent file uploads`, async () => {
      const requests = Array(PERFORMANCE_THRESHOLDS.CONCURRENT_UPLOADS).fill().map(() => 
        request(app)
          .post('/api/upload')
          .set('Authorization', `Bearer ${validToken}`)
          .attach('file', testFile)
      );

      const start = performance.now();
      const responses = await Promise.all(requests);
      const end = performance.now();
      const totalTime = end - start;

      expect(responses.every(r => r.status === 200)).toBe(true);
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FILE_UPLOAD_TIME * 2);
    });
  });

  describe('Memory Usage Tests', () => {
    test('should maintain stable memory usage during multiple requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      for (let i = 0; i < 100; i++) {
        await request(app)
          .get('/api/status')
          .set('Authorization', `Bearer ${validToken}`);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_INCREASE);
    });

    test('should handle memory pressure gracefully', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Simulate memory pressure
      const largeArray = [];
      for (let i = 0; i < 1000000; i++) {
        largeArray.push({ data: 'test' });
      }
      
      // Clear memory
      largeArray.length = 0;
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_INCREASE);
    });
  });

  describe('Database Performance Tests', () => {
    test('database queries should complete within threshold', async () => {
      const start = performance.now();
      
      const result = await pool.query('SELECT 1');
      
      const end = performance.now();
      const queryTime = end - start;

      expect(result.rows[0]).toEqual({ '?column?': 1 });
      expect(queryTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DB_QUERY_TIME);
    });

    test('should handle concurrent database queries efficiently', async () => {
      const queries = Array(50).fill().map(() => 
        pool.query('SELECT 1')
      );

      const start = performance.now();
      await Promise.all(queries);
      const end = performance.now();
      const totalTime = end - start;

      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DB_QUERY_TIME * 2);
    });
  });

  describe('Cache Performance Tests', () => {
    test('cached responses should be significantly faster than uncached', async () => {
      // First request (uncached)
      const start1 = performance.now();
      await request(app)
        .get('/api/status')
        .set('Authorization', `Bearer ${validToken}`);
      const time1 = performance.now() - start1;

      // Second request (cached)
      const start2 = performance.now();
      await request(app)
        .get('/api/status')
        .set('Authorization', `Bearer ${validToken}`);
      const time2 = performance.now() - start2;

      const improvement = (time1 - time2) / time1;
      expect(improvement).toBeGreaterThan(PERFORMANCE_THRESHOLDS.CACHE_IMPROVEMENT);
    });
  });

  describe('System Resource Tests', () => {
    test('CPU usage should remain stable under load', async () => {
      const { stdout: initialCpu } = await execAsync('wmic cpu get loadpercentage');
      const initialLoad = parseInt(initialCpu.split('\n')[1]);
      
      // Generate load
      const requests = Array(50).fill().map(() => 
        request(app)
          .get('/api/status')
          .set('Authorization', `Bearer ${validToken}`)
      );
      await Promise.all(requests);
      
      const { stdout: finalCpu } = await execAsync('wmic cpu get loadpercentage');
      const finalLoad = parseInt(finalCpu.split('\n')[1]);
      
      expect(finalLoad - initialLoad).toBeLessThan(50); // Less than 50% increase
    });

    test('Disk I/O should be efficient', async () => {
      const start = performance.now();
      
      // Perform file operations
      const fileOps = Array(10).fill().map(() => 
        request(app)
          .post('/api/upload')
          .set('Authorization', `Bearer ${validToken}`)
          .attach('file', testFile)
      );
      await Promise.all(fileOps);
      
      const end = performance.now();
      const totalTime = end - start;

      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FILE_UPLOAD_TIME * 2);
    });
  });
}); 