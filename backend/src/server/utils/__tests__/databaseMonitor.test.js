jest.mock('../performanceMonitor', () => ({
  performanceMonitor: {
    recordMetric: jest.fn()
  }
}));

jest.mock('../errorHandler', () => ({
  errorHandler: {
    handleError: jest.fn()
  }
}));

const { databaseMonitor } = require('../databaseMonitor');
const { performanceMonitor } = require('../performanceMonitor');
const { errorHandler } = require('../errorHandler');

describe('DatabaseMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('wrapQuery', () => {
    it('should track successful query execution', async () => {
      const mockQuery = jest.fn().mockResolvedValue('result');
      const wrappedQuery = databaseMonitor.wrapQuery(mockQuery);
      
      const result = await wrappedQuery('SELECT * FROM users');
      
      expect(result).toBe('result');
      expect(performanceMonitor.recordMetric).toHaveBeenCalledWith('queryTime', expect.any(Number));
      expect(databaseMonitor.getActiveQueries()).toHaveLength(0);
    });

    it('should handle query errors', async () => {
      const mockQuery = jest.fn().mockRejectedValue(new Error('Query failed'));
      const wrappedQuery = databaseMonitor.wrapQuery(mockQuery);
      
      await expect(wrappedQuery('SELECT * FROM users')).rejects.toThrow('Query failed');
      
      expect(errorHandler.handleError).toHaveBeenCalled();
      expect(databaseMonitor.getActiveQueries()).toHaveLength(0);
    });

    it('should track query duration', async () => {
      const mockQuery = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('result'), 100))
      );
      const wrappedQuery = databaseMonitor.wrapQuery(mockQuery);
      
      await wrappedQuery('SELECT * FROM users');
      
      const recordedTime = performanceMonitor.recordMetric.mock.calls[0][1];
      expect(recordedTime).toBeGreaterThanOrEqual(100);
    });
  });

  describe('wrapTransaction', () => {
    it('should track successful transaction', async () => {
      const mockTransaction = jest.fn().mockResolvedValue('result');
      const wrappedTransaction = databaseMonitor.wrapTransaction(mockTransaction);
      
      const result = await wrappedTransaction();
      
      expect(result).toBe('result');
      expect(performanceMonitor.recordMetric).toHaveBeenCalledWith('transactionTime', expect.any(Number));
      expect(databaseMonitor.getActiveQueries()).toHaveLength(0);
    });

    it('should handle transaction errors', async () => {
      const mockTransaction = jest.fn().mockRejectedValue(new Error('Transaction failed'));
      const wrappedTransaction = databaseMonitor.wrapTransaction(mockTransaction);
      
      await expect(wrappedTransaction()).rejects.toThrow('Transaction failed');
      
      expect(errorHandler.handleError).toHaveBeenCalled();
      expect(databaseMonitor.getActiveQueries()).toHaveLength(0);
    });

    it('should track transaction duration', async () => {
      const mockTransaction = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('result'), 200))
      );
      const wrappedTransaction = databaseMonitor.wrapTransaction(mockTransaction);
      
      await wrappedTransaction();
      
      const recordedTime = performanceMonitor.recordMetric.mock.calls[0][1];
      expect(recordedTime).toBeGreaterThanOrEqual(200);
    });
  });

  describe('connection status', () => {
    it('should update connection status', () => {
      databaseMonitor.updateConnectionStatus('connected');
      expect(databaseMonitor.getQueryStats().connectionStatus).toBe('connected');
    });

    it('should handle connection errors', () => {
      databaseMonitor.updateConnectionStatus('error');
      expect(errorHandler.handleError).toHaveBeenCalled();
    });
  });

  describe('query statistics', () => {
    it('should track query counts', async () => {
      const mockQuery = jest.fn().mockResolvedValue('result');
      const wrappedQuery = databaseMonitor.wrapQuery(mockQuery);
      
      await wrappedQuery('SELECT 1');
      await wrappedQuery('SELECT 2');
      
      const stats = databaseMonitor.getQueryStats();
      expect(stats.total).toBe(2);
      expect(stats.completed).toBe(2);
      expect(stats.active).toBe(0);
    });

    it('should track active queries', async () => {
      const mockQuery = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      const wrappedQuery = databaseMonitor.wrapQuery(mockQuery);
      
      const queryPromise = wrappedQuery('SELECT * FROM users');
      
      expect(databaseMonitor.getActiveQueries()).toHaveLength(1);
      
      await queryPromise;
      expect(databaseMonitor.getActiveQueries()).toHaveLength(0);
    });
  });
}); 