const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Hata detaylarını logla
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    user: req.user?.username || 'anonymous',
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  });

  // Hata yanıtını oluştur
  const errorResponse = {
    error: err.name || 'Internal Server Error',
    message: err.message || 'Bir hata oluştu',
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // HTTP durum kodunu belirle
  let statusCode = err.statusCode || 500;
  
  // Mongoose hataları için özel işleme
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorResponse.error = 'Validation Error';
    errorResponse.details = Object.values(err.errors).map(e => e.message);
  }

  // JWT hataları için özel işleme
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorResponse.error = 'Authentication Error';
    errorResponse.message = 'Geçersiz token';
  }

  // Rate limit hataları için özel işleme
  if (err.name === 'RateLimitError') {
    statusCode = 429;
    errorResponse.error = 'Rate Limit Exceeded';
    errorResponse.message = 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.';
  }

  // MongoDB bağlantı hataları için özel işleme
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    statusCode = 503;
    errorResponse.error = 'Database Error';
    errorResponse.message = 'Veritabanı bağlantısında bir sorun oluştu. Lütfen daha sonra tekrar deneyin.';
  }

  // Dosya sistemi hataları için özel işleme
  if (err.code === 'ENOENT') {
    statusCode = 404;
    errorResponse.error = 'File Not Found';
    errorResponse.message = 'İstenen dosya bulunamadı.';
  }

  // İzin hataları için özel işleme
  if (err.code === 'EACCES' || err.code === 'EPERM') {
    statusCode = 403;
    errorResponse.error = 'Permission Denied';
    errorResponse.message = 'Bu işlem için yetkiniz bulunmuyor.';
  }

  // Hata istatistiklerini güncelle
  if (!req.app.locals.errorStats) {
    req.app.locals.errorStats = {
      totalErrors: 0,
      byType: {},
      byPath: {},
      byStatus: {}
    };
  }

  const stats = req.app.locals.errorStats;
  stats.totalErrors++;

  // Hata tipi bazlı istatistikler
  if (!stats.byType[err.name]) {
    stats.byType[err.name] = 0;
  }
  stats.byType[err.name]++;

  // Path bazlı istatistikler
  if (!stats.byPath[req.path]) {
    stats.byPath[req.path] = 0;
  }
  stats.byPath[req.path]++;

  // Durum kodu bazlı istatistikler
  if (!stats.byStatus[statusCode]) {
    stats.byStatus[statusCode] = 0;
  }
  stats.byStatus[statusCode]++;

  // Her 10 hatada bir özet rapor oluştur
  if (stats.totalErrors % 10 === 0) {
    logger.warn('Error summary:', {
      totalErrors: stats.totalErrors,
      byType: stats.byType,
      byPath: stats.byPath,
      byStatus: stats.byStatus
    });
  }

  // Yanıtı gönder
  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler; 