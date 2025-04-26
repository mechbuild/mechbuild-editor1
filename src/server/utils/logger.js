const winston = require('winston');
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, json } = format;
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Create logger instance
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    // Error logs
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined logs
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5
    }),
    // Console output with colors
    new transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        consoleFormat
      )
    })
  ]
});

// Add request logging method
logger.request = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || 'anonymous'
  };

  // Sanitize sensitive data
  if (req.body) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) delete sanitizedBody.password;
    if (sanitizedBody.token) delete sanitizedBody.token;
    logData.body = sanitizedBody;
  }

  // Log based on status code
  if (res.statusCode >= 500) {
    logger.error('Request failed', logData);
  } else if (res.statusCode >= 400) {
    logger.warn('Request warning', logData);
  } else {
    logger.info('Request completed', logData);
  }
};

// Add error logging method
logger.errorWithContext = (error, context = {}) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    ...context
  };
  logger.error('Error occurred', errorData);
};

// Add performance logging method
logger.performance = (metric, value, context = {}) => {
  logger.info('Performance metric', {
    metric,
    value,
    ...context
  });
};

module.exports = { logger }; 