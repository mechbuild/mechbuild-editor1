const logger = require('../utils/logger');
const crypto = require('crypto');

const requestLogger = (req, res, next) => {
  // İstek başlangıcını logla
  const start = Date.now();
  const requestId = crypto.randomBytes(16).toString('hex');

  // İstek detaylarını logla
  logger.debug('Request started:', {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    user: req.user?.username || 'anonymous',
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });

  // Hassas verileri filtrele
  const sanitizedHeaders = { ...req.headers };
  if (sanitizedHeaders.authorization) {
    sanitizedHeaders.authorization = 'Bearer [REDACTED]';
  }
  if (sanitizedHeaders.cookie) {
    sanitizedHeaders.cookie = '[REDACTED]';
  }

  // İstek gövdesini logla (hassas verileri filtrele)
  let sanitizedBody = null;
  if (req.body && typeof req.body === 'object') {
    sanitizedBody = { ...req.body };
    if (sanitizedBody.password) delete sanitizedBody.password;
    if (sanitizedBody.token) delete sanitizedBody.token;
    if (sanitizedBody.creditCard) delete sanitizedBody.creditCard;
  }

  // Performans metriklerini topla
  const metrics = {
    startTime: start,
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage()
  };

  // Yanıt tamamlandığında logla
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      user: req.user?.username || 'anonymous',
      userAgent: req.get('user-agent'),
      headers: sanitizedHeaders,
      body: sanitizedBody,
      metrics: {
        ...metrics,
        endTime: Date.now(),
        totalDuration: duration,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };

    // Log seviyesini belirle
    let logLevel = 'info';
    if (res.statusCode >= 500) {
      logLevel = 'error';
      logger.error('Request failed', logData);
    } else if (res.statusCode >= 400) {
      logLevel = 'warn';
      logger.warn('Request warning', logData);
    } else if (duration > 1000) {
      logLevel = 'warn';
      logger.warn('Slow request', { ...logData, duration });
    } else {
      logger.info('Request completed', logData);
    }

    // Güvenlik olaylarını kontrol et
    if (res.statusCode === 401 || res.statusCode === 403) {
      logger.security('Security event detected', {
        ...logData,
        eventType: res.statusCode === 401 ? 'unauthorized_access' : 'forbidden_access'
      });
    }

    // İstek istatistiklerini güncelle
    if (!req.app.locals.requestStats) {
      req.app.locals.requestStats = {
        totalRequests: 0,
        totalDuration: 0,
        errorCount: 0,
        successCount: 0,
        byMethod: {},
        byPath: {},
        byStatus: {}
      };
    }

    const stats = req.app.locals.requestStats;
    stats.totalRequests++;
    stats.totalDuration += duration;

    // Metod bazlı istatistikler
    if (!stats.byMethod[req.method]) {
      stats.byMethod[req.method] = 0;
    }
    stats.byMethod[req.method]++;

    // Path bazlı istatistikler
    if (!stats.byPath[req.path]) {
      stats.byPath[req.path] = 0;
    }
    stats.byPath[req.path]++;

    // Durum kodu bazlı istatistikler
    if (!stats.byStatus[res.statusCode]) {
      stats.byStatus[res.statusCode] = 0;
    }
    stats.byStatus[res.statusCode]++;

    if (res.statusCode >= 400) {
      stats.errorCount++;
    } else {
      stats.successCount++;
    }

    // Her 100 istekte bir özet rapor oluştur
    if (stats.totalRequests % 100 === 0) {
      const avgDuration = stats.totalDuration / stats.totalRequests;
      logger.info('Request summary:', {
        totalRequests: stats.totalRequests,
        averageDuration: `${avgDuration.toFixed(2)}ms`,
        errorRate: `${((stats.errorCount / stats.totalRequests) * 100).toFixed(2)}%`,
        byMethod: stats.byMethod,
        byPath: stats.byPath,
        byStatus: stats.byStatus
      });
    }
  });

  next();
};

module.exports = requestLogger; 