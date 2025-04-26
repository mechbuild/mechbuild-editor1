const NodeCache = require('node-cache');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');

// Cache yapılandırması
const cacheConfig = {
  stdTTL: 3600, // 1 saat varsayılan TTL
  checkperiod: 600, // 10 dakikada bir kontrol
  maxKeys: 10000, // Maksimum cache key sayısı
  useClones: false // Performans için clone'lamayı devre dışı bırak
};

// Cache instance'ı oluştur
const cache = new NodeCache(cacheConfig);

// Cache middleware
const cacheMiddleware = (duration = 60) => { // 1 dakika varsayılan cache süresi
  return (req, res, next) => {
    // Sadece GET isteklerini cache'le
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = `${req.originalUrl}:${JSON.stringify(req.query)}`;
    const cachedResponse = cache.get(key);
    
    if (cachedResponse) {
      metrics.increment('cache_hits');
      return res.json(cachedResponse);
    }
    
    // Orijinal send fonksiyonunu sakla
    const originalSend = res.send;
    
    // Send fonksiyonunu override et
    res.send = function(data) {
      cache.set(key, JSON.parse(data), duration);
      metrics.increment('cache_misses');
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Cache istatistikleri
const getCacheStats = () => {
  const stats = cache.getStats();
  return {
    hits: stats.hits,
    misses: stats.misses,
    keys: stats.keys,
    ksize: stats.ksize,
    vsize: stats.vsize
  };
};

// Cache temizleme
const clearCache = (pattern) => {
  const keys = cache.keys();
  let cleared = 0;
  
  if (pattern) {
    const regex = new RegExp(pattern);
    keys.forEach(key => {
      if (regex.test(key)) {
        cache.del(key);
        cleared++;
      }
    });
  } else {
    cache.flushAll();
    cleared = keys.length;
  }
  
  logger.info('Cache cleared', { pattern, cleared });
  return cleared;
};

// Cache monitoring
const monitorCache = () => {
  setInterval(() => {
    const stats = getCacheStats();
    const hitRate = stats.hits / (stats.hits + stats.misses) || 0;
    
    metrics.gauge('cache_hit_rate', hitRate);
    metrics.gauge('cache_keys', stats.keys);
    metrics.gauge('cache_memory_usage', stats.vsize);
    
    if (hitRate < 0.5) {
      logger.warn('Low cache hit rate', { hitRate });
    }
    
    if (stats.keys > cacheConfig.maxKeys * 0.9) {
      logger.warn('Cache approaching maximum capacity', { 
        current: stats.keys,
        max: cacheConfig.maxKeys
      });
    }
  }, 60000); // Her dakika kontrol et
};

module.exports = {
  cacheMiddleware,
  getCacheStats,
  clearCache,
  monitorCache
}; 