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

const { requestMonitor } = require('../requestMonitor');
const { performanceMonitor } = require('../performanceMonitor');
const { errorHandler } = require('../errorHandler');

describe('RequestMonitor', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      method: 'GET',
      path: '/api/test'
    };
    
    mockRes = {
      statusCode: 200,
      send: jest.fn(),
      on: jest.fn()
    };
    
    mockNext = jest.fn();
  });

  describe('middleware', () => {
    it('should track request start time', () => {
      const middleware = requestMonitor.middleware();
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(requestMonitor.getActiveRequests()).toHaveLength(1);
    });

    it('should record response time on successful request', () => {
      const middleware = requestMonitor.middleware();
      middleware(mockReq, mockRes, mockNext);
      
      // Simulate response
      mockRes.send('response');
      
      expect(performanceMonitor.recordMetric).toHaveBeenCalledWith('responseTime', expect.any(Number));
      expect(requestMonitor.getActiveRequests()).toHaveLength(0);
    });

    it('should handle request errors', () => {
      const middleware = requestMonitor.middleware();
      middleware(mockReq, mockRes, mockNext);
      
      // Simulate error
      const error = new Error('Test error');
      mockRes.emit('error', error);
      
      expect(errorHandler.handleError).toHaveBeenCalledWith(error, expect.any(Object));
      expect(requestMonitor.getActiveRequests()).toHaveLength(0);
    });

    it('should track multiple concurrent requests', () => {
      const middleware = requestMonitor.middleware();
      
      // Simulate multiple requests
      middleware(mockReq, mockRes, mockNext);
      middleware({ ...mockReq, path: '/api/test2' }, mockRes, mockNext);
      
      expect(requestMonitor.getActiveRequests()).toHaveLength(2);
    });
  });

  describe('getRequestStats', () => {
    it('should return correct request statistics', () => {
      const middleware = requestMonitor.middleware();
      
      // Simulate some requests
      middleware(mockReq, mockRes, mockNext);
      middleware({ ...mockReq, path: '/api/test2' }, mockRes, mockNext);
      
      // Complete one request
      mockRes.send('response');
      
      const stats = requestMonitor.getRequestStats();
      
      expect(stats.total).toBe(2);
      expect(stats.active).toBe(1);
      expect(stats.completed).toBe(1);
    });

    it('should calculate average response time correctly', () => {
      const middleware = requestMonitor.middleware();
      
      // Simulate requests with different durations
      middleware(mockReq, mockRes, mockNext);
      jest.advanceTimersByTime(100);
      mockRes.send('response1');
      
      middleware(mockReq, mockRes, mockNext);
      jest.advanceTimersByTime(200);
      mockRes.send('response2');
      
      const stats = requestMonitor.getRequestStats();
      expect(stats.averageResponseTime).toBe(150);
    });
  });

  describe('request cleanup', () => {
    it('should clean up completed requests', () => {
      const middleware = requestMonitor.middleware();
      
      middleware(mockReq, mockRes, mockNext);
      mockRes.send('response');
      
      expect(requestMonitor.getActiveRequests()).toHaveLength(0);
    });

    it('should clean up errored requests', () => {
      const middleware = requestMonitor.middleware();
      
      middleware(mockReq, mockRes, mockNext);
      mockRes.emit('error', new Error('Test error'));
      
      expect(requestMonitor.getActiveRequests()).toHaveLength(0);
    });
  });
}); 