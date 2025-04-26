const logger = require('../utils/logger');
const crypto = require('crypto');

const securityAudit = (req, res, next) => {
  // Güvenlik olaylarını izle
  const securityEvents = [];

  // XSS denemelerini kontrol et
  if (req.query && Object.values(req.query).some(value => 
    typeof value === 'string' && /<script|javascript:|on\w+=/i.test(value)
  )) {
    securityEvents.push({
      type: 'XSS Attempt',
      details: 'Potansiyel XSS saldırısı tespit edildi',
      data: req.query,
      severity: 'high'
    });
  }

  // SQL injection denemelerini kontrol et
  if (req.query && Object.values(req.query).some(value => 
    typeof value === 'string' && /['";]|--|\/\*|\*\/|union\s+select/i.test(value)
  )) {
    securityEvents.push({
      type: 'SQL Injection Attempt',
      details: 'Potansiyel SQL injection saldırısı tespit edildi',
      data: req.query,
      severity: 'critical'
    });
  }

  // Command injection denemelerini kontrol et
  if (req.query && Object.values(req.query).some(value => 
    typeof value === 'string' && /[;&|`]|\.\/|\.\.\//.test(value)
  )) {
    securityEvents.push({
      type: 'Command Injection Attempt',
      details: 'Potansiyel komut enjeksiyonu saldırısı tespit edildi',
      data: req.query,
      severity: 'critical'
    });
  }

  // Path traversal denemelerini kontrol et
  if (req.query && Object.values(req.query).some(value => 
    typeof value === 'string' && /\.\.\/|\.\.\\|\.\/|\.\\/.test(value)
  )) {
    securityEvents.push({
      type: 'Path Traversal Attempt',
      details: 'Potansiyel dizin gezinme saldırısı tespit edildi',
      data: req.query,
      severity: 'high'
    });
  }

  // Brute force denemelerini kontrol et
  if (req.path.includes('/login') || req.path.includes('/auth')) {
    const ip = req.ip;
    const now = Date.now();
    const window = 15 * 60 * 1000; // 15 dakika

    // IP bazlı başarısız giriş denemelerini say
    const failedAttempts = req.app.locals.failedAttempts || {};
    if (!failedAttempts[ip]) {
      failedAttempts[ip] = { count: 0, timestamp: now, blocked: false };
    }

    if (now - failedAttempts[ip].timestamp > window) {
      failedAttempts[ip] = { count: 0, timestamp: now, blocked: false };
    }

    failedAttempts[ip].count++;

    if (failedAttempts[ip].count > 5) {
      failedAttempts[ip].blocked = true;
      securityEvents.push({
        type: 'Brute Force Attempt',
        details: 'Çok sayıda başarısız giriş denemesi',
        ip: ip,
        attempts: failedAttempts[ip].count,
        severity: 'high'
      });
    }

    req.app.locals.failedAttempts = failedAttempts;
  }

  // Dosya yükleme güvenliği
  if (req.files) {
    Object.values(req.files).forEach(file => {
      // MIME type kontrolü
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.mimetype)) {
        securityEvents.push({
          type: 'Invalid File Type',
          details: 'İzin verilmeyen dosya türü',
          file: file.name,
          mimetype: file.mimetype,
          severity: 'medium'
        });
      }

      // Dosya boyutu kontrolü
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        securityEvents.push({
          type: 'Large File Upload',
          details: 'İzin verilen boyuttan büyük dosya',
          file: file.name,
          size: file.size,
          severity: 'medium'
        });
      }
    });
  }

  // Güvenlik başlıkları kontrolü
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'"
  };

  Object.entries(securityHeaders).forEach(([header, value]) => {
    if (res.get(header) !== value) {
      securityEvents.push({
        type: 'Missing Security Header',
        details: `Eksik güvenlik başlığı: ${header}`,
        severity: 'low'
      });
    }
  });

  // Güvenlik olaylarını logla
  if (securityEvents.length > 0) {
    securityEvents.forEach(event => {
      const logData = {
        type: event.type,
        details: event.details,
        path: req.path,
        method: req.method,
        ip: req.ip,
        user: req.user?.username || 'anonymous',
        severity: event.severity,
        timestamp: new Date().toISOString(),
        ...event
      };

      // Olayın önem derecesine göre log seviyesini belirle
      switch (event.severity) {
        case 'critical':
          logger.error('Critical security event:', logData);
          break;
        case 'high':
          logger.warn('High severity security event:', logData);
          break;
        case 'medium':
          logger.warn('Medium severity security event:', logData);
          break;
        case 'low':
          logger.info('Low severity security event:', logData);
          break;
        default:
          logger.warn('Security event:', logData);
      }
    });
  }

  next();
};

module.exports = securityAudit; 