const { performanceMonitor } = require('./performanceMonitor');
const { errorHandler } = require('./errorHandler');

class DatabaseMonitor {
  constructor() {
    this.queryCount = 0;
    this.activeQueries = new Map();
    this.connectionStatus = 'disconnected';
  }

  wrapQuery(queryFunction) {
    return async (...args) => {
      const queryId = ++this.queryCount;
      const startTime = Date.now();

      try {
        // Record query start
        this.activeQueries.set(queryId, {
          startTime,
          status: 'executing',
          query: args[0] // Assuming first arg is the query
        });

        // Execute query
        const result = await queryFunction(...args);

        // Record success
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        performanceMonitor.recordMetric('queryTime', duration);
        
        this.activeQueries.delete(queryId);
        
        return result;
      } catch (error) {
        // Handle database error
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const dbError = new Error(error.message);
        dbError.name = 'DatabaseError';
        dbError.query = args[0];
        dbError.duration = duration;
        
        errorHandler.handleError(dbError, {
          queryId,
          query: args[0],
          duration
        });

        this.activeQueries.delete(queryId);
        throw dbError;
      }
    };
  }

  wrapTransaction(transactionFunction) {
    return async (...args) => {
      const transactionId = ++this.queryCount;
      const startTime = Date.now();

      try {
        this.activeQueries.set(transactionId, {
          startTime,
          status: 'transaction',
          type: 'transaction'
        });

        const result = await transactionFunction(...args);

        const endTime = Date.now();
        const duration = endTime - startTime;
        
        performanceMonitor.recordMetric('transactionTime', duration);
        
        this.activeQueries.delete(transactionId);
        
        return result;
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const txError = new Error(error.message);
        txError.name = 'TransactionError';
        txError.duration = duration;
        
        errorHandler.handleError(txError, {
          transactionId,
          duration
        });

        this.activeQueries.delete(transactionId);
        throw txError;
      }
    };
  }

  updateConnectionStatus(status) {
    this.connectionStatus = status;
    
    if (status === 'error') {
      const error = new Error('Database connection error');
      error.name = 'DatabaseConnectionError';
      errorHandler.handleError(error, { status });
    }
  }

  getQueryStats() {
    const active = this.activeQueries.size;
    const completed = this.queryCount - active;
    
    return {
      total: this.queryCount,
      active,
      completed,
      connectionStatus: this.connectionStatus
    };
  }

  getActiveQueries() {
    return Array.from(this.activeQueries.entries()).map(([id, info]) => ({
      id,
      ...info
    }));
  }
}

module.exports = {
  databaseMonitor: new DatabaseMonitor()
}; 