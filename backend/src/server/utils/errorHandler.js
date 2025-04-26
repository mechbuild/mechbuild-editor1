const { logger } = require('./logger');
const { performanceMonitor } = require('./performanceMonitor');

class ErrorHandler {
  constructor() {
    this.errorCategories = {
      API: 'API',
      DATABASE: 'DATABASE',
      VALIDATION: 'VALIDATION',
      AUTHENTICATION: 'AUTHENTICATION',
      SYSTEM: 'SYSTEM'
    };

    this.severityLevels = {
      CRITICAL: 'CRITICAL',
      HIGH: 'HIGH',
      MEDIUM: 'MEDIUM',
      LOW: 'LOW'
    };
  }

  handleError(error, context = {}) {
    const errorInfo = this.categorizeError(error, context);
    
    // Log error
    this.logError(errorInfo);
    
    // Record error metric
    performanceMonitor.recordMetric('errorRate', 1);
    
    // Generate alert if needed
    if (errorInfo.severity === this.severityLevels.CRITICAL) {
      this.generateAlert(errorInfo);
    }

    return errorInfo;
  }

  categorizeError(error, context) {
    let category = this.errorCategories.SYSTEM;
    let severity = this.severityLevels.MEDIUM;

    if (error.name === 'ValidationError') {
      category = this.errorCategories.VALIDATION;
      severity = this.severityLevels.LOW;
    } else if (error.name === 'DatabaseError') {
      category = this.errorCategories.DATABASE;
      severity = this.severityLevels.HIGH;
    } else if (error.name === 'AuthenticationError') {
      category = this.errorCategories.AUTHENTICATION;
      severity = this.severityLevels.HIGH;
    } else if (error.name === 'APIError') {
      category = this.errorCategories.API;
      severity = this.severityLevels.MEDIUM;
    }

    return {
      category,
      severity,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context
    };
  }

  logError(errorInfo) {
    const logMessage = `[${errorInfo.category}] ${errorInfo.message} - Severity: ${errorInfo.severity}`;
    
    switch (errorInfo.severity) {
      case this.severityLevels.CRITICAL:
        logger.error(logMessage);
        break;
      case this.severityLevels.HIGH:
        logger.error(logMessage);
        break;
      case this.severityLevels.MEDIUM:
        logger.warn(logMessage);
        break;
      default:
        logger.info(logMessage);
    }
  }

  generateAlert(errorInfo) {
    const alert = {
      type: 'error',
      category: errorInfo.category,
      severity: errorInfo.severity,
      message: errorInfo.message,
      timestamp: errorInfo.timestamp
    };

    performanceMonitor.recordMetric('alerts', alert);
  }

  createErrorResponse(errorInfo) {
    return {
      success: false,
      error: {
        code: this.getErrorCode(errorInfo.category),
        message: errorInfo.message,
        category: errorInfo.category
      }
    };
  }

  getErrorCode(category) {
    const codes = {
      [this.errorCategories.API]: 'API_ERR',
      [this.errorCategories.DATABASE]: 'DB_ERR',
      [this.errorCategories.VALIDATION]: 'VAL_ERR',
      [this.errorCategories.AUTHENTICATION]: 'AUTH_ERR',
      [this.errorCategories.SYSTEM]: 'SYS_ERR'
    };
    return codes[category] || 'UNKNOWN_ERR';
  }
}

module.exports = {
  errorHandler: new ErrorHandler()
}; 