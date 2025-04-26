const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

class CacheService {
    constructor() {
        this.cacheDir = path.join(__dirname, '../../cache');
        this.cache = new Map();
        this.ensureCacheDirectory();
    }

    async ensureCacheDirectory() {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
        } catch (error) {
            logger.error('Failed to create cache directory', { error });
        }
    }

    generateCacheKey(data) {
        return crypto
            .createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex');
    }

    async get(key) {
        try {
            // Önce memory cache'den kontrol et
            if (this.cache.has(key)) {
                const cached = this.cache.get(key);
                if (Date.now() < cached.expires) {
                    return cached.data;
                }
                this.cache.delete(key);
            }

            // Sonra dosya cache'den kontrol et
            const filePath = path.join(this.cacheDir, `${key}.json`);
            try {
                const content = await fs.readFile(filePath, 'utf8');
                const { data, expires } = JSON.parse(content);
                
                if (Date.now() < expires) {
                    // Memory cache'e ekle
                    this.cache.set(key, { data, expires });
                    return data;
                }
                
                // Süresi dolmuş cache'i sil
                await fs.unlink(filePath);
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    logger.error('Cache read error', { key, error });
                }
            }
            
            return null;
        } catch (error) {
            logger.error('Cache get error', { key, error });
            return null;
        }
    }

    async set(key, data, ttl = 3600) { // Varsayılan TTL: 1 saat
        try {
            const expires = Date.now() + (ttl * 1000);
            
            // Memory cache'e ekle
            this.cache.set(key, { data, expires });
            
            // Dosya cache'e ekle
            const filePath = path.join(this.cacheDir, `${key}.json`);
            await fs.writeFile(
                filePath,
                JSON.stringify({ data, expires }),
                'utf8'
            );
            
            return true;
        } catch (error) {
            logger.error('Cache set error', { key, error });
            return false;
        }
    }

    async delete(key) {
        try {
            // Memory cache'den sil
            this.cache.delete(key);
            
            // Dosya cache'den sil
            const filePath = path.join(this.cacheDir, `${key}.json`);
            await fs.unlink(filePath).catch(() => {});
            
            return true;
        } catch (error) {
            logger.error('Cache delete error', { key, error });
            return false;
        }
    }

    async clear() {
        try {
            // Memory cache'i temizle
            this.cache.clear();
            
            // Dosya cache'i temizle
            const files = await fs.readdir(this.cacheDir);
            await Promise.all(
                files.map(file => 
                    fs.unlink(path.join(this.cacheDir, file))
                )
            );
            
            return true;
        } catch (error) {
            logger.error('Cache clear error', { error });
            return false;
        }
    }

    async cleanup() {
        try {
            const now = Date.now();
            const files = await fs.readdir(this.cacheDir);
            
            for (const file of files) {
                const filePath = path.join(this.cacheDir, file);
                try {
                    const content = await fs.readFile(filePath, 'utf8');
                    const { expires } = JSON.parse(content);
                    
                    if (now >= expires) {
                        await fs.unlink(filePath);
                        const key = file.replace('.json', '');
                        this.cache.delete(key);
                    }
                } catch (error) {
                    logger.error('Cache cleanup error', { file, error });
                }
            }
        } catch (error) {
            logger.error('Cache cleanup error', { error });
        }
    }
}

// Singleton instance
const cacheService = new CacheService();

// Periyodik temizleme
setInterval(() => cacheService.cleanup(), 3600000); // Her saat başı

module.exports = cacheService; 