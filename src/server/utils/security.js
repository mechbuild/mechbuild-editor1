const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const logger = require('./logger');

// Helmet güvenlik başlıkları yapılandırması
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-site" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
});

// Rate limiting yapılandırması
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP başına maksimum istek sayısı
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.',
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { ip: req.ip });
    res.status(429).json({
      error: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.'
    });
  }
});

// Dosya yükleme validasyonu
const fileUploadValidation = [
  body('file').custom((value, { req }) => {
    if (!req.file) {
      throw new Error('Dosya yüklenmedi');
    }
    if (req.file.size > 10 * 1024 * 1024) { // 10MB
      throw new Error('Dosya boyutu çok büyük');
    }
    if (!req.file.mimetype.includes('spreadsheetml')) {
      throw new Error('Geçersiz dosya türü');
    }
    return true;
  })
];

// Rapor oluşturma validasyonu
const reportGenerationValidation = [
  body('title').trim().isLength({ min: 3, max: 100 }),
  body('format').isIn(['pdf', 'html', 'excel']),
  body('includeCharts').isBoolean(),
  body('includeFormulas').isBoolean(),
  body('includeStyles').isBoolean(),
  body('includeDetails').isBoolean(),
  body('includeRecommendations').isBoolean()
];

// Validasyon hata işleyici
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation error', { errors: errors.array() });
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Güvenlik başlıkları
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
};

// Dosya güvenliği
const fileSecurity = {
  allowedExtensions: ['.xlsx'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  scanForViruses: true,
  sanitizeFilename: (filename) => {
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  }
};

// API güvenliği
const apiSecurity = {
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiration: '24h',
  apiKeyHeader: 'X-API-Key',
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100
  }
};

// Güvenlik loglama
const securityLogger = {
  logAuthAttempt: (success, username, ip) => {
    logger.info('Authentication attempt', { success, username, ip });
  },
  logFileUpload: (filename, size, user) => {
    logger.info('File upload', { filename, size, user });
  },
  logSecurityEvent: (event, details) => {
    logger.warn('Security event', { event, details });
  }
};

module.exports = {
  helmetConfig,
  limiter,
  fileUploadValidation,
  reportGenerationValidation,
  validate,
  securityHeaders,
  fileSecurity,
  apiSecurity,
  securityLogger
}; 