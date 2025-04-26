const { pool } = require('../config/database');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

class QueryOptimizer {
  constructor() {
    this.queryCache = new Map();
    this.stats = {
      totalQueries: 0,
      cachedQueries: 0,
      slowQueries: 0,
      averageQueryTime: 0
    };
  }

  async executeQuery(query, params = [], options = {}) {
    const start = process.hrtime();
    const cacheKey = this.getCacheKey(query, params);

    // Check cache if enabled
    if (options.useCache && this.queryCache.has(cacheKey)) {
      this.stats.cachedQueries++;
      return this.queryCache.get(cacheKey);
    }

    try {
      const result = await pool.query(query, params);
      
      // Update stats
      const [seconds, nanoseconds] = process.hrtime(start);
      const queryTime = seconds * 1000 + nanoseconds / 1000000;
      
      this.stats.totalQueries++;
      this.stats.averageQueryTime = 
        (this.stats.averageQueryTime * (this.stats.totalQueries - 1) + queryTime) / 
        this.stats.totalQueries;

      if (queryTime > 100) { // More than 100ms is considered slow
        this.stats.slowQueries++;
        console.warn(`Slow query detected: ${query} (${queryTime}ms)`);
      }

      // Cache result if enabled
      if (options.useCache) {
        this.queryCache.set(cacheKey, result);
        setTimeout(() => this.queryCache.delete(cacheKey), options.cacheTTL || 60000);
      }

      return result;
    } catch (error) {
      console.error('Query execution error:', error);
      throw error;
    }
  }

  getCacheKey(query, params) {
    return `${query}-${JSON.stringify(params)}`;
  }

  async analyzeQuery(query) {
    try {
      const explainQuery = `EXPLAIN ANALYZE ${query}`;
      const result = await pool.query(explainQuery);
      return this.parseExplainResult(result.rows);
    } catch (error) {
      console.error('Query analysis error:', error);
      return null;
    }
  }

  parseExplainResult(rows) {
    return rows.map(row => ({
      operation: row['QUERY PLAN'],
      executionTime: this.extractExecutionTime(row['QUERY PLAN'])
    }));
  }

  extractExecutionTime(plan) {
    const timeMatch = plan.match(/Execution Time: (\d+\.\d+) ms/);
    return timeMatch ? parseFloat(timeMatch[1]) : null;
  }

  async optimizeTable(tableName) {
    try {
      const result = await pool.query(`VACUUM ANALYZE ${tableName}`);
      return result;
    } catch (error) {
      console.error('Table optimization error:', error);
      throw error;
    }
  }

  async getQueryStats() {
    return {
      ...this.stats,
      cacheSize: this.queryCache.size,
      timestamp: new Date().toISOString()
    };
  }

  async monitorDatabase() {
    try {
      const [connections, locks, activity] = await Promise.all([
        pool.query('SELECT count(*) FROM pg_stat_activity'),
        pool.query('SELECT * FROM pg_locks'),
        pool.query('SELECT * FROM pg_stat_activity WHERE state = \'active\'')
      ]);

      return {
        activeConnections: connections.rows[0].count,
        locks: locks.rows,
        activeQueries: activity.rows,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Database monitoring error:', error);
      return null;
    }
  }

  async createIndex(table, columns, options = {}) {
    const indexName = options.name || `${table}_${columns.join('_')}_idx`;
    const unique = options.unique ? 'UNIQUE' : '';
    const columnsStr = columns.join(', ');

    try {
      const query = `CREATE ${unique} INDEX ${indexName} ON ${table} (${columnsStr})`;
      await pool.query(query);
      return { success: true, indexName };
    } catch (error) {
      console.error('Index creation error:', error);
      throw error;
    }
  }

  async dropIndex(indexName) {
    try {
      await pool.query(`DROP INDEX IF EXISTS ${indexName}`);
      return { success: true };
    } catch (error) {
      console.error('Index drop error:', error);
      throw error;
    }
  }
}

module.exports = new QueryOptimizer(); 