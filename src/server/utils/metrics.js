const client = require('prom-client');
const logger = require('./logger');

// Prometheus istemcisini başlat
const register = new client.Registry();

// Metrik tanımlamaları
const requestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const memoryHeapUsed = new client.Gauge({
  name: 'nodejs_memory_heap_used_bytes',
  help: 'Process heap used in bytes'
});

const memoryHeapTotal = new client.Gauge({
  name: 'nodejs_memory_heap_total_bytes',
  help: 'Process heap total in bytes'
});

const memoryRSS = new client.Gauge({
  name: 'nodejs_memory_rss_bytes',
  help: 'Process resident set size in bytes'
});

const cpuUserPercent = new client.Gauge({
  name: 'nodejs_cpu_user_percent',
  help: 'CPU user time percentage'
});

const cpuSystemPercent = new client.Gauge({
  name: 'nodejs_cpu_system_percent',
  help: 'CPU system time percentage'
});

const eventLoopDelay = new client.Gauge({
  name: 'nodejs_event_loop_delay_seconds',
  help: 'Event loop delay in seconds'
});

// Metrikleri kayıt defterine ekle
register.registerMetric(requestDuration);
register.registerMetric(memoryHeapUsed);
register.registerMetric(memoryHeapTotal);
register.registerMetric(memoryRSS);
register.registerMetric(cpuUserPercent);
register.registerMetric(cpuSystemPercent);
register.registerMetric(eventLoopDelay);

// Metrik toplama fonksiyonları
const histogram = (name, value, labels = {}) => {
  try {
    switch (name) {
      case 'request_duration':
        requestDuration.observe(labels, value / 1000); // milisaniyeyi saniyeye çevir
        break;
      default:
        logger.warn(`Unknown histogram metric: ${name}`);
    }
  } catch (error) {
    logger.error('Error recording histogram metric', { error });
  }
};

const gauge = (name, value) => {
  try {
    switch (name) {
      case 'memory_heap_used':
        memoryHeapUsed.set(value);
        break;
      case 'memory_heap_total':
        memoryHeapTotal.set(value);
        break;
      case 'memory_rss':
        memoryRSS.set(value);
        break;
      case 'cpu_user_percent':
        cpuUserPercent.set(value);
        break;
      case 'cpu_system_percent':
        cpuSystemPercent.set(value);
        break;
      case 'event_loop_delay':
        eventLoopDelay.set(value / 1000); // milisaniyeyi saniyeye çevir
        break;
      default:
        logger.warn(`Unknown gauge metric: ${name}`);
    }
  } catch (error) {
    logger.error('Error recording gauge metric', { error });
  }
};

// Metrikleri Prometheus formatında döndür
const getMetrics = async () => {
  try {
    return await register.metrics();
  } catch (error) {
    logger.error('Error getting metrics', { error });
    return '';
  }
};

export const metrics = {
  cpu: [],
  memory: [],
  responseTime: [],
  errorRate: [],
  alerts: []
};

module.exports = {
  histogram,
  gauge,
  getMetrics
}; 