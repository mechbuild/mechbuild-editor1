const logger = require('../utils/logger');
const os = require('os');

// Performans metriklerini topla
const collectMetrics = () => {
  return {
    timestamp: new Date().toISOString(),
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: process.memoryUsage()
    },
    cpu: {
      loadavg: os.loadavg(),
      cores: os.cpus().length,
      usage: process.cpuUsage()
    },
    uptime: {
      system: os.uptime(),
      process: process.uptime()
    },
    network: {
      interfaces: os.networkInterfaces()
    }
  };
};

const performanceMonitor = (req, res, next) => {
  const startTime = process.hrtime();
  const startMetrics = collectMetrics();

  // Yanıt tamamlandığında metrikleri logla
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1000000;
    const endMetrics = collectMetrics();

    const performanceData = {
      request: {
        method: req.method,
        path: req.path,
        duration: `${duration.toFixed(2)}ms`
      },
      metrics: {
        start: startMetrics,
        end: endMetrics,
        delta: {
          memory: {
            heapUsed: endMetrics.memory.used.heapUsed - startMetrics.memory.used.heapUsed,
            heapTotal: endMetrics.memory.used.heapTotal - startMetrics.memory.used.heapTotal,
            rss: endMetrics.memory.used.rss - startMetrics.memory.used.rss
          },
          cpu: {
            user: endMetrics.cpu.usage.user - startMetrics.cpu.usage.user,
            system: endMetrics.cpu.usage.system - startMetrics.cpu.usage.system
          }
        }
      }
    };

    // Performans uyarılarını kontrol et
    if (duration > 1000) {
      logger.warn('Slow request detected', performanceData);
    }

    if (endMetrics.memory.used.heapUsed > 500 * 1024 * 1024) { // 500MB
      logger.warn('High memory usage detected', performanceData);
    }

    if (os.loadavg()[0] > os.cpus().length * 0.8) {
      logger.warn('High CPU load detected', performanceData);
    }

    // Performans metriklerini logla
    logger.debug('Performance metrics', performanceData);
  });

  next();
};

// Periyodik sistem metriklerini topla
setInterval(() => {
  const metrics = collectMetrics();
  logger.debug('System metrics', metrics);
}, 60000); // Her dakika

module.exports = performanceMonitor; 