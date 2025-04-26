const { metrics } = require('./metrics');
const { logger } = require('./logger');

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.alerts = new Map();
    this.thresholds = {
      cpu: 80,
      memory: 85,
      responseTime: 1000,
      errorRate: 0.05
    };
  }

  recordMetric(type, value) {
    const timestamp = Date.now();
    const metric = { value, timestamp };

    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }
    this.metrics.get(type).push(metric);

    // Check thresholds and generate alerts
    this.checkThresholds(type, value);

    // Update metrics array
    metrics[type].push(metric);
  }

  checkThresholds(type, value) {
    if (value > this.thresholds[type]) {
      const alert = {
        type,
        value,
        timestamp: Date.now(),
        threshold: this.thresholds[type]
      };

      if (!this.alerts.has(type)) {
        this.alerts.set(type, []);
      }
      this.alerts.get(type).push(alert);
      metrics.alerts.push(alert);

      logger.warn(`Alert: ${type} exceeded threshold. Value: ${value}, Threshold: ${this.thresholds[type]}`);
    }
  }

  getMetricsInRange(type, startTime, endTime) {
    if (!this.metrics.has(type)) {
      return [];
    }

    return this.metrics.get(type).filter(metric => {
      return metric.timestamp >= startTime && metric.timestamp <= endTime;
    });
  }

  generateReport(options = {}) {
    const { startTime = 0, endTime = Date.now() } = options;
    const report = {
      cpu: this.getMetricsInRange('cpu', startTime, endTime),
      memory: this.getMetricsInRange('memory', startTime, endTime),
      responseTime: this.getMetricsInRange('responseTime', startTime, endTime),
      errorRate: this.getMetricsInRange('errorRate', startTime, endTime)
    };

    logger.info('Performance report generated');
    return report;
  }
}

module.exports = {
  performanceMonitor: new PerformanceMonitor()
};
