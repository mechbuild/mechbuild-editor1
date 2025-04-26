import { databaseOptimizer } from '../databaseOptimizer';
import { metrics } from '../metrics';
import { logger } from '../logger';

jest.mock('../metrics');
jest.mock('../logger');

describe('DatabaseOptimizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    databaseOptimizer.queryCache.clear();
    databaseOptimizer.connectionPool.clear();
    databaseOptimizer.indexStats.clear();
  });

  describe('Query Caching', () => {
    it('should cache query results', async () => {
      const query = 'SELECT * FROM users';
      const params = { id: 1 };
      const result = [{ id: 1, name: 'Test User' }];

      await databaseOptimizer.cacheQuery(query, params, result);
      const cached = await databaseOptimizer.getCachedQuery(query, params);

      expect(cached).toEqual(result);
      expect(metrics.increment).toHaveBeenCalledWith('database.query_cache_hits');
    });

    it('should not return expired cache entries', async () => {
      const query = 'SELECT * FROM users';
      const params = { id: 1 };
      const result = [{ id: 1, name: 'Test User' }];

      await databaseOptimizer.cacheQuery(query, params, result);
      
      // Simulate cache expiration
      const cacheEntry = databaseOptimizer.queryCache.get(databaseOptimizer.generateCacheKey(query, params));
      cacheEntry.timestamp = Date.now() - 300001; // 5 minutes + 1ms

      const cached = await databaseOptimizer.getCachedQuery(query, params);
      expect(cached).toBeNull();
    });
  });

  describe('Connection Pool Management', () => {
    it('should create and manage connection pool', async () => {
      const connection = await databaseOptimizer.getConnection();
      expect(connection).toBeDefined();
      expect(databaseOptimizer.connectionPool.size).toBe(1);

      await databaseOptimizer.releaseConnection(connection);
      // Add assertions for connection release
    });

    it('should reuse existing connection pool', async () => {
      const pool1 = await databaseOptimizer.getConnection();
      const pool2 = await databaseOptimizer.getConnection();
      
      expect(databaseOptimizer.connectionPool.size).toBe(1);
      expect(pool1).toBe(pool2);
    });
  });

  describe('Index Analysis', () => {
    it('should analyze and recommend index optimizations', async () => {
      const table = 'users';
      const recommendations = await databaseOptimizer.analyzeIndexes(table);

      expect(recommendations).toBeInstanceOf(Array);
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('type');
        expect(rec).toHaveProperty('recommendation');
      });
    });

    it('should detect unused indexes', async () => {
      const table = 'users';
      const stats = {
        indexes: ['idx_name', 'idx_email'],
        usage: {
          'idx_name': 0.05, // 5% usage
          'idx_email': 0.8  // 80% usage
        },
        column_usage: {}
      };

      databaseOptimizer.getIndexStats = jest.fn().mockResolvedValue(stats);
      const recommendations = await databaseOptimizer.analyzeIndexes(table);

      const unusedIndexRec = recommendations.find(r => r.type === 'unused_index');
      expect(unusedIndexRec).toBeDefined();
      expect(unusedIndexRec.index).toBe('idx_name');
    });

    it('should suggest missing indexes', async () => {
      const table = 'users';
      const stats = {
        indexes: ['idx_name'],
        usage: {},
        column_usage: {
          'email': 150, // 150 queries
          'name': 50    // 50 queries
        }
      };

      databaseOptimizer.getIndexStats = jest.fn().mockResolvedValue(stats);
      const recommendations = await databaseOptimizer.analyzeIndexes(table);

      const missingIndexRec = recommendations.find(r => r.type === 'missing_index');
      expect(missingIndexRec).toBeDefined();
      expect(missingIndexRec.column).toBe('email');
    });
  });

  describe('Query Optimization', () => {
    it('should detect full table scans', async () => {
      const query = 'SELECT * FROM users';
      const plan = {
        type: 'ALL',
        rows: 10000
      };

      databaseOptimizer.explainQuery = jest.fn().mockResolvedValue(plan);
      const optimizations = await databaseOptimizer.optimizeQuery(query);

      const fullScanRec = optimizations.find(o => o.type === 'full_scan');
      expect(fullScanRec).toBeDefined();
      expect(fullScanRec.recommendation).toContain('İndeks kullanımı');
    });

    it('should suggest pagination for large result sets', async () => {
      const query = 'SELECT * FROM users';
      const plan = {
        type: 'INDEX',
        rows: 5000
      };

      databaseOptimizer.explainQuery = jest.fn().mockResolvedValue(plan);
      const optimizations = await databaseOptimizer.optimizeQuery(query);

      const largeResultRec = optimizations.find(o => o.type === 'large_result');
      expect(largeResultRec).toBeDefined();
      expect(largeResultRec.recommendation).toContain('Sayfalama');
    });
  });

  describe('Error Handling', () => {
    it('should handle connection pool errors gracefully', async () => {
      databaseOptimizer.createConnectionPool = jest.fn().mockRejectedValue(new Error('Connection failed'));
      
      await expect(databaseOptimizer.getConnection()).rejects.toThrow('Connection failed');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle index analysis errors', async () => {
      databaseOptimizer.getIndexStats = jest.fn().mockRejectedValue(new Error('Analysis failed'));
      
      await expect(databaseOptimizer.analyzeIndexes('users')).rejects.toThrow('Analysis failed');
      expect(logger.error).toHaveBeenCalled();
    });
  });
}); 