const compression = require('compression');
const responseTime = require('response-time');
const cache = require('memory-cache');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');
const cacheService = require('../services/cache');
const { performanceOptimizer } = require('../utils/performanceOptimizer');

// Response time middleware
const responseTimeMiddleware = responseTime((req, res, time) => {
  metrics.histogram('http_response_time', time);
  logger.debug('Request completed', {
    method: req.method,
    path: req.path,
    duration: time
  });
});

// Compression middleware
const compressionMiddleware = (req, res, next) => {
  const acceptEncoding = req.headers['accept-encoding'];
  if (!acceptEncoding) {
    return next();
  }

  if (acceptEncoding.includes('gzip')) {
    res.setHeader('Content-Encoding', 'gzip');
    // Gzip sıkıştırma işlemi
  } else if (acceptEncoding.includes('deflate')) {
    res.setHeader('Content-Encoding', 'deflate');
    // Deflate sıkıştırma işlemi
  }

  next();
};

// Cache middleware
const cacheMiddleware = async (req, res, next) => {
  const cacheKey = `${req.method}:${req.originalUrl}`;
  
  try {
    const cachedResponse = await cache.get(cacheKey);
    if (cachedResponse) {
      logger.info(`Önbellekten yanıt döndürüldü: ${cacheKey}`);
      return res.json(cachedResponse);
    }

    // Orijinal yanıt fonksiyonunu sakla
    const originalJson = res.json;
    res.json = function(data) {
      // Yanıtı önbelleğe al
      cache.set(cacheKey, data, 300); // 5 dakika önbellekleme
      return originalJson.call(this, data);
    };

    next();
  } catch (error) {
    logger.error('Önbellekleme hatası:', error);
    next();
  }
};

// Query optimization middleware
const queryOptimization = (req, res, next) => {
  // Limit query parameters
  const maxParams = 10;
  if (Object.keys(req.query).length > maxParams) {
    return res.status(400).json({
      error: 'Too many query parameters',
      message: `Maximum ${maxParams} query parameters allowed`
    });
  }

  // Sanitize query parameters
  const sanitizedQuery = {};
  Object.keys(req.query).forEach(key => {
    if (key.length <= 50) { // Limit parameter name length
      sanitizedQuery[key] = req.query[key].slice(0, 100); // Limit parameter value length
    }
  });
  req.query = sanitizedQuery;

  // Sorgu parametrelerini kontrol et ve optimize et
  if (req.query) {
    // Gereksiz parametreleri kaldır
    Object.keys(req.query).forEach(key => {
      if (!req.query[key]) {
        delete req.query[key];
      }
    });

    // Sıralama parametrelerini optimize et
    if (req.query.sort) {
      const validSortFields = ['timestamp', 'cpu', 'memory', 'responseTime'];
      if (!validSortFields.includes(req.query.sort)) {
        delete req.query.sort;
      }
    }

    // Sayfalama parametrelerini optimize et
    if (req.query.page) {
      const page = parseInt(req.query.page);
      if (isNaN(page) || page < 1) {
        req.query.page = '1';
      }
    }

    if (req.query.limit) {
      const limit = parseInt(req.query.limit);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        req.query.limit = '10';
      }
    }
  }

  next();
};

// Resource optimization middleware
const resourceOptimization = (req, res, next) => {
  // Set appropriate headers for resource optimization
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.setHeader('Vary', 'Accept-Encoding');
  
  // Enable keep-alive
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=5, max=1000');

  next();
};

// Memory usage monitoring
const memoryMonitor = (req, res, next) => {
  const startMemory = process.memoryUsage();
  
  res.on('finish', () => {
    const endMemory = process.memoryUsage();
    const memoryDiff = {
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external
    };

    metrics.gauge('memory.heap_used', endMemory.heapUsed);
    metrics.gauge('memory.heap_total', endMemory.heapTotal);
    metrics.gauge('memory.external', endMemory.external);

    if (memoryDiff.heapUsed > 50 * 1024 * 1024) { // 50MB
      logger.warn('High memory usage detected', {
        path: req.path,
        memoryDiff
      });
    }
  });

  next();
};

// İstek hızı sınırlama
const rateLimitMiddleware = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60000; // 1 dakika
  const maxRequests = 100; // Maksimum istek sayısı

  try {
    const requestCount = cache.get(`rate_limit:${ip}`) || 0;
    const windowStart = cache.get(`rate_limit_window:${ip}`) || now;

    if (now - windowStart > windowMs) {
      // Pencere süresi doldu, sıfırla
      cache.set(`rate_limit:${ip}`, 1);
      cache.set(`rate_limit_window:${ip}`, now);
    } else if (requestCount >= maxRequests) {
      // İstek limiti aşıldı
      return res.status(429).json({
        error: 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.'
      });
    } else {
      // İstek sayısını artır
      cache.set(`rate_limit:${ip}`, requestCount + 1);
    }

    next();
  } catch (error) {
    logger.error('Hız sınırlama hatası:', error);
    next();
  }
};

// Performans izleme
const performanceMonitoringMiddleware = async (req, res, next) => {
  const startTime = process.hrtime();
  const startMemory = process.memoryUsage();

  // Yanıt tamamlandığında metrikleri topla
  res.on('finish', async () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1000000;
    const endMemory = process.memoryUsage();
    const memoryDiff = endMemory.heapUsed - startMemory.heapUsed;

    const metrics = {
      path: req.path,
      method: req.method,
      duration,
      memoryUsage: {
        start: startMemory.heapUsed,
        end: endMemory.heapUsed,
        diff: memoryDiff
      },
      timestamp: new Date()
    };

    // Metrikleri kaydet
    await logger.info('Performans metrikleri:', metrics);

    // Performans analizi yap ve önerileri al
    const recommendations = await performanceOptimizer.analyzePerformance();
    if (recommendations.length > 0) {
      await logger.warn('Performans önerileri:', recommendations);
    }
  });

  next();
};

// Yanıt süresi izleme
const responseTimeLogger = responseTime((req, res, time) => {
  const status = res.statusCode;
  const method = req.method;
  const url = req.url;
  
  if (time > 1000) {
    logger.warn('Yavaş API yanıtı', {
      method,
      url,
      status,
      time: `${time.toFixed(2)}ms`
    });
  } else {
    logger.debug('API yanıt süresi', {
      method,
      url,
      status,
      time: `${time.toFixed(2)}ms`
    });
  }
});

// Yanıt önbelleğe alma
const cacheControl = (req, res, next) => {
  // Statik dosyalar için uzun süreli önbellek
  if (req.path.startsWith('/static/')) {
    res.set('Cache-Control', 'public, max-age=31536000'); // 1 yıl
  }
  // API yanıtları için kısa süreli önbellek
  else if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=300'); // 5 dakika
  }
  next();
};

// Gzip sıkıştırma kontrolü
const checkCompression = (req, res, next) => {
  const acceptEncoding = req.headers['accept-encoding'];
  if (!acceptEncoding || !acceptEncoding.includes('gzip')) {
    logger.debug('İstemci gzip sıkıştırmayı desteklemiyor', {
      url: req.url,
      acceptEncoding
    });
  }
  next();
};

// Büyük yanıtları parçalama
const chunkResponse = (req, res, next) => {
  const originalSend = res.send;
  res.send = function (body) {
    if (typeof body === 'string' && body.length > 1000000) {
      logger.debug('Büyük yanıt parçalanıyor', {
        url: req.url,
        size: body.length
      });
      const chunks = body.match(/.{1,100000}/g);
      res.set('Transfer-Encoding', 'chunked');
      chunks.forEach(chunk => originalSend.call(this, chunk));
    } else {
      originalSend.call(this, body);
    }
  };
  next();
};

// API yanıt önbelleğe alma
const apiCache = async (req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }

  const cacheKey = `api:${req.originalUrl}`;
  try {
    const cachedResponse = await cacheService.get(cacheKey);
    if (cachedResponse) {
      logger.debug('Önbellekten yanıt döndürülüyor', { url: req.url });
      return res.json(cachedResponse);
    }

    // Yanıtı önbelleğe al
    const originalJson = res.json;
    res.json = function (data) {
      cacheService.set(cacheKey, data, 300); // 5 dakika
      originalJson.call(this, data);
    };

    next();
  } catch (error) {
    logger.error('Önbellek hatası:', error);
    next();
  }
};

module.exports = {
  responseTimeMiddleware,
  compressionMiddleware,
  cacheMiddleware,
  queryOptimization,
  resourceOptimization,
  memoryMonitor,
  performanceMonitoringMiddleware,
  responseTimeLogger,
  cacheControl,
  checkCompression,
  chunkResponse,
  apiCache,
  rateLimit: rateLimitMiddleware
}; 