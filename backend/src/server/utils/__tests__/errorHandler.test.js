jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../performanceMonitor', () => ({
  performanceMonitor: {
    recordMetric: jest.fn()
  }
}));

const { errorHandler } = require('../errorHandler');
const { logger } = require('../logger');
const { performanceMonitor } = require('../performanceMonitor');

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleError', () => {
    it('should handle validation errors correctly', () => {
      const error = new Error('Invalid input');
      error.name = 'ValidationError';
      
      const result = errorHandler.handleError(error);
      
      expect(result.category).toBe('VALIDATION');
      expect(result.severity).toBe('LOW');
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should handle database errors correctly', () => {
      const error = new Error('Connection failed');
      error.name = 'DatabaseError';
      
      const result = errorHandler.handleError(error);
      
      expect(result.category).toBe('DATABASE');
      expect(result.severity).toBe('HIGH');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle critical errors with alerts', () => {
      const error = new Error('System failure');
      error.name = 'SystemError';
      
      const result = errorHandler.handleError(error, { severity: 'CRITICAL' });
      
      expect(result.severity).toBe('CRITICAL');
      expect(performanceMonitor.recordMetric).toHaveBeenCalledWith('alerts', expect.any(Object));
    });

    it('should include context in error info', () => {
      const error = new Error('Test error');
      const context = { userId: 123, action: 'login' };
      
      const result = errorHandler.handleError(error, context);
      
      expect(result.context).toEqual(context);
    });
  });

  describe('createErrorResponse', () => {
    it('should create standardized error response', () => {
      const errorInfo = {
        category: 'API',
        message: 'Invalid request',
        severity: 'MEDIUM'
      };
      
      const response = errorHandler.createErrorResponse(errorInfo);
      
      expect(response).toEqual({
        success: false,
        error: {
          code: 'API_ERR',
          message: 'Invalid request',
          category: 'API'
        }
      });
    });

    it('should handle unknown error categories', () => {
      const errorInfo = {
        category: 'UNKNOWN',
        message: 'Unknown error'
      };
      
      const response = errorHandler.createErrorResponse(errorInfo);
      
      expect(response.error.code).toBe('UNKNOWN_ERR');
    });
  });

  describe('error categorization', () => {
    it('should categorize API errors', () => {
      const error = new Error('API Error');
      error.name = 'APIError';
      
      const result = errorHandler.handleError(error);
      
      expect(result.category).toBe('API');
      expect(result.severity).toBe('MEDIUM');
    });

    it('should categorize authentication errors', () => {
      const error = new Error('Auth failed');
      error.name = 'AuthenticationError';
      
      const result = errorHandler.handleError(error);
      
      expect(result.category).toBe('AUTHENTICATION');
      expect(result.severity).toBe('HIGH');
    });

    it('should default to system error for unknown types', () => {
      const error = new Error('Unknown error');
      error.name = 'UnknownError';
      
      const result = errorHandler.handleError(error);
      
      expect(result.category).toBe('SYSTEM');
      expect(result.severity).toBe('MEDIUM');
    });
  });

  describe('error metrics', () => {
    it('should record error metrics', () => {
      const error = new Error('Test error');
      
      errorHandler.handleError(error);
      
      expect(performanceMonitor.recordMetric).toHaveBeenCalledWith('errorRate', 1);
    });

    it('should record multiple errors correctly', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');
      
      errorHandler.handleError(error1);
      errorHandler.handleError(error2);
      
      expect(performanceMonitor.recordMetric).toHaveBeenCalledTimes(2);
    });
  });
}); 