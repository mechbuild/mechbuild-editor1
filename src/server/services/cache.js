const Redis = require('ioredis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.memoryCache = new Map();
    this.defaultTTL = 300; // 5 dakika
  }

  // Redis bağlantı kontrolü
  async checkConnection() {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      logger.error('Redis bağlantı hatası:', error);
      return false;
    }
  }

  // Önbelleğe alma
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const serializedValue = JSON.stringify(value);
      
      // Redis'e kaydet
      if (await this.checkConnection()) {
        await this.redis.set(key, serializedValue, 'EX', ttl);
      }
      
      // Memory cache'e kaydet
      this.memoryCache.set(key, {
        value: serializedValue,
        expiry: Date.now() + (ttl * 1000)
      });

      logger.debug('Önbelleğe kaydedildi', { key, ttl });
    } catch (error) {
      logger.error('Önbelleğe kaydetme hatası:', error);
    }
  }

  // Önbellekten alma
  async get(key) {
    try {
      // Önce memory cache'den kontrol et
      const cached = this.memoryCache.get(key);
      if (cached && cached.expiry > Date.now()) {
        return JSON.parse(cached.value);
      }

      // Redis'ten kontrol et
      if (await this.checkConnection()) {
        const value = await this.redis.get(key);
        if (value) {
          const parsedValue = JSON.parse(value);
          // Memory cache'e de kaydet
          this.memoryCache.set(key, {
            value,
            expiry: Date.now() + (this.defaultTTL * 1000)
          });
          return parsedValue;
        }
      }

      return null;
    } catch (error) {
      logger.error('Önbellekten alma hatası:', error);
      return null;
    }
  }

  // Önbellekten silme
  async delete(key) {
    try {
      // Memory cache'den sil
      this.memoryCache.delete(key);
      
      // Redis'ten sil
      if (await this.checkConnection()) {
        await this.redis.del(key);
      }

      logger.debug('Önbellekten silindi', { key });
    } catch (error) {
      logger.error('Önbellekten silme hatası:', error);
    }
  }

  // Önbelleği temizle
  async clear() {
    try {
      // Memory cache'i temizle
      this.memoryCache.clear();
      
      // Redis'i temizle
      if (await this.checkConnection()) {
        await this.redis.flushall();
      }

      logger.info('Önbellek temizlendi');
    } catch (error) {
      logger.error('Önbellek temizleme hatası:', error);
    }
  }

  // Önbellek istatistikleri
  async getStats() {
    try {
      const stats = {
        memorySize: this.memoryCache.size,
        redisConnected: await this.checkConnection()
      };

      if (stats.redisConnected) {
        stats.redisKeys = await this.redis.dbsize();
      }

      return stats;
    } catch (error) {
      logger.error('İstatistik alma hatası:', error);
      return null;
    }
  }
}

// Singleton instance
const cacheService = new CacheService();
module.exports = cacheService; 