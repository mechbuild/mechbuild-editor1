const { requestMonitor } = require('../utils/requestMonitor');
const { logger } = require('../utils/logger');
const { ErrorHandler } = require('../utils/errorHandler');
const crypto = require('crypto');

const errorHandler = new ErrorHandler();

const requestMonitoringMiddleware = (req, res, next) => {
  // Generate unique request ID
  const requestId = crypto.randomBytes(16).toString('hex');
  
  // Start monitoring the request
  const startTime = Date.now();
  requestMonitor.startRequest(requestId, req.url, req.method);

  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);

  // Store original end function
  const originalEnd = res.end;

  // Override end function to capture response
  res.end = function(chunk, encoding) {
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // End the request monitoring
    requestMonitor.endRequest(requestId, res.statusCode, responseTime);

    // Log the request
    logger.request(req, res, responseTime);

    // Log performance metrics if response time is high
    if (responseTime > 1000) { // 1 second threshold
      logger.performance('slow_request', responseTime, {
        requestId,
        url: req.url,
        method: req.method
      });
    }

    // Handle errors
    if (res.statusCode >= 400) {
      const error = new Error(`Request failed with status ${res.statusCode}`);
      error.status = res.statusCode;
      errorHandler.handleError(error, {
        requestId,
        url: req.url,
        method: req.method,
        responseTime
      });
    }

    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };

  // Handle request errors
  req.on('error', (error) => {
    requestMonitor.endRequest(requestId, 500, Date.now() - startTime);
    errorHandler.handleError(error, {
      requestId,
      url: req.url,
      method: req.method
    });
  });

  next();
};

module.exports = requestMonitoringMiddleware; 