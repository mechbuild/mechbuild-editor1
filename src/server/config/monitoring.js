const winston = require('winston');
const { createLogger, format, transports } = winston;
const { combine, timestamp, json } = format;
const Prometheus = require('prom-client');
const { AlertManager } = require('prometheus-alert-manager');

// Prometheus metrikleri
const metrics = {
  http: {
    requestDuration: new Prometheus.Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5]
    }),
    requestsTotal: new Prometheus.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status']
    })
  },
  memory: {
    heapUsed: new Prometheus.Gauge({
      name: 'nodejs_heap_used_bytes',
      help: 'Process heap used in bytes'
    }),
    heapTotal: new Prometheus.Gauge({
      name: 'nodejs_heap_total_bytes',
      help: 'Process heap total in bytes'
    })
  },
  cache: {
    hits: new Prometheus.Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits'
    }),
    misses: new Prometheus.Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses'
    })
  },
  errors: {
    total: new Prometheus.Counter({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['type']
    })
  }
};

// Winston logger yapılandırması
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    new transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

// Alert Manager yapılandırması
const alertManager = new AlertManager({
  url: process.env.ALERT_MANAGER_URL || 'http://localhost:9093',
  rules: [
    {
      alert: 'HighErrorRate',
      expr: 'rate(errors_total[5m]) > 0.1',
      for: '5m',
      labels: {
        severity: 'critical'
      },
      annotations: {
        summary: 'High error rate detected',
        description: 'Error rate is above 0.1 for 5 minutes'
      }
    },
    {
      alert: 'HighMemoryUsage',
      expr: 'nodejs_heap_used_bytes / nodejs_heap_total_bytes > 0.8',
      for: '5m',
      labels: {
        severity: 'warning'
      },
      annotations: {
        summary: 'High memory usage detected',
        description: 'Heap usage is above 80% for 5 minutes'
      }
    },
    {
      alert: 'HighLatency',
      expr: 'rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m]) > 1',
      for: '5m',
      labels: {
        severity: 'warning'
      },
      annotations: {
        summary: 'High latency detected',
        description: 'Average request duration is above 1 second for 5 minutes'
      }
    }
  ]
});

// Monitoring middleware
const monitoringMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    // HTTP metriklerini güncelle
    metrics.http.requestDuration
      .labels(req.method, req.path, res.statusCode)
      .observe(duration);
    
    metrics.http.requestsTotal
      .labels(req.method, req.path, res.statusCode)
      .inc();
    
    // Bellek kullanımını güncelle
    const memoryUsage = process.memoryUsage();
    metrics.memory.heapUsed.set(memoryUsage.heapUsed);
    metrics.memory.heapTotal.set(memoryUsage.heapTotal);
    
    // Hata durumunda logla
    if (res.statusCode >= 400) {
      metrics.errors.total.inc({ type: 'http' });
      logger.error('HTTP error', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration
      });
    }
  });
  
  next();
};

module.exports = {
  metrics,
  logger,
  alertManager,
  monitoringMiddleware
}; 