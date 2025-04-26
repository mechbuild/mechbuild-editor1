import { logger } from './logger';
import { metrics } from './metrics';
import { performance } from 'perf_hooks';

// Metrik tipleri için sabit değerler
const METRIC_TYPES = {
  CPU: 'cpu_usage',
  MEMORY: 'memory_usage',
  RESPONSE_TIME: 'response_time',
  ERROR_RATE: 'error_rate'
};

// Eşik değerleri için sabit değerler
const THRESHOLDS = {
  CPU: 80,
  MEMORY: 85,
  RESPONSE_TIME: 1000,
  ERROR_RATE: 0.05
};

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.alerts = new Map();
    this.thresholds = THRESHOLDS;
  }

  // Performans metriklerini kaydet
  recordMetric(name, value, tags = {}) {
    try {
      if (!Object.values(METRIC_TYPES).includes(name)) {
        throw new Error(`Invalid metric type: ${name}`);
      }

      const timestamp = Date.now();
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      this.metrics.get(name).push({ timestamp, value, tags });
      metrics.record(name, value, tags);
    } catch (error) {
      logger.error(`Error recording metric ${name}:`, error);
      throw error;
    }
  }

  // CPU kullanımını izle
  monitorCPU() {
    try {
      const startUsage = process.cpuUsage();
      const startTime = performance.now();

      return {
        stop: () => {
          try {
            const endUsage = process.cpuUsage(startUsage);
            const endTime = performance.now();
            const timeDiff = endTime - startTime;
            
            if (timeDiff === 0) {
              throw new Error('CPU monitoring duration is zero');
            }

            const cpuPercent = (endUsage.user + endUsage.system) / timeDiff * 100;
            this.recordMetric(METRIC_TYPES.CPU, cpuPercent);
            this.checkAlert('cpu', cpuPercent);
            
            return cpuPercent;
          } catch (error) {
            logger.error('Error in CPU monitoring:', error);
            throw error;
          }
        }
      };
    } catch (error) {
      logger.error('Error starting CPU monitoring:', error);
      throw error;
    }
  }

  // Bellek kullanımını izle
  monitorMemory() {
    try {
      const memoryUsage = process.memoryUsage();
      const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      
      this.recordMetric(METRIC_TYPES.MEMORY, heapUsedPercent);
      this.checkAlert('memory', heapUsedPercent);
      
      return heapUsedPercent;
    } catch (error) {
      logger.error('Error in memory monitoring:', error);
      throw error;
    }
  }

  // Yanıt süresini izle
  monitorResponseTime() {
    try {
      const startTime = performance.now();
      
      return {
        stop: () => {
          try {
            const duration = performance.now() - startTime;
            this.recordMetric(METRIC_TYPES.RESPONSE_TIME, duration);
            this.checkAlert('responseTime', duration);
            
            return duration;
          } catch (error) {
            logger.error('Error in response time monitoring:', error);
            throw error;
          }
        }
      };
    } catch (error) {
      logger.error('Error starting response time monitoring:', error);
      throw error;
    }
  }

  // Hata oranını izle
  monitorErrorRate(totalRequests, errorCount) {
    try {
      if (totalRequests === 0) {
        throw new Error('Total requests cannot be zero');
      }

      const errorRate = errorCount / totalRequests;
      this.recordMetric(METRIC_TYPES.ERROR_RATE, errorRate);
      this.checkAlert('errorRate', errorRate);
      
      return errorRate;
    } catch (error) {
      logger.error('Error in error rate monitoring:', error);
      throw error;
    }
  }

  // Uyarı kontrolü
  checkAlert(type, value) {
    try {
      if (!this.thresholds[type]) {
        throw new Error(`Invalid alert type: ${type}`);
      }

      if (value > this.thresholds[type]) {
        const alert = {
          type,
          value,
          threshold: this.thresholds[type],
          timestamp: Date.now()
        };
        
        this.alerts.set(`${type}_${Date.now()}`, alert);
        logger.warn(`Performance alert: ${type} exceeded threshold`, alert);
      }
    } catch (error) {
      logger.error('Error in alert checking:', error);
      throw error;
    }
  }

  // Performans raporu oluştur
  generateReport(options = {}) {
    try {
      const { startTime, endTime } = options;
      const report = {
        summary: this.generateSummary(),
        metrics: this.getMetricsInRange(startTime, endTime),
        alerts: this.getAlertsInRange(startTime, endTime),
        recommendations: this.generateRecommendations()
      };
      
      return report;
    } catch (error) {
      logger.error('Error generating report:', error);
      throw error;
    }
  }

  // Özet rapor oluştur
  generateSummary() {
    try {
      return {
        cpu: this.calculateAverage(METRIC_TYPES.CPU),
        memory: this.calculateAverage(METRIC_TYPES.MEMORY),
        responseTime: this.calculateAverage(METRIC_TYPES.RESPONSE_TIME),
        errorRate: this.calculateAverage(METRIC_TYPES.ERROR_RATE)
      };
    } catch (error) {
      logger.error('Error generating summary:', error);
      throw error;
    }
  }

  // Belirli bir zaman aralığındaki metrikleri getir
  getMetricsInRange(startTime, endTime) {
    try {
      const result = {};
      
      for (const [name, data] of this.metrics.entries()) {
        result[name] = data.filter(item => {
          if (startTime && item.timestamp < startTime) return false;
          if (endTime && item.timestamp > endTime) return false;
          return true;
        });
      }
      
      return result;
    } catch (error) {
      logger.error('Error getting metrics in range:', error);
      throw error;
    }
  }

  // Belirli bir zaman aralığındaki uyarıları getir
  getAlertsInRange(startTime, endTime) {
    try {
      return Array.from(this.alerts.values()).filter(alert => {
        if (startTime && alert.timestamp < startTime) return false;
        if (endTime && alert.timestamp > endTime) return false;
        return true;
      });
    } catch (error) {
      logger.error('Error getting alerts in range:', error);
      throw error;
    }
  }

  // Optimizasyon önerileri oluştur
  generateRecommendations() {
    try {
      const recommendations = [];
      const summary = this.generateSummary();

      if (summary.cpu > this.thresholds.cpu * 0.8) {
        recommendations.push({
          type: 'cpu',
          severity: 'high',
          message: 'High CPU usage. Consider load balancing or scaling.'
        });
      }

      if (summary.memory > this.thresholds.memory * 0.8) {
        recommendations.push({
          type: 'memory',
          severity: 'high',
          message: 'High memory usage. Check for memory leaks.'
        });
      }

      if (summary.responseTime > this.thresholds.responseTime * 0.8) {
        recommendations.push({
          type: 'response_time',
          severity: 'medium',
          message: 'High response times. Optimize database queries and caching.'
        });
      }

      if (summary.errorRate > this.thresholds.errorRate * 0.8) {
        recommendations.push({
          type: 'error_rate',
          severity: 'high',
          message: 'High error rate. Review error handling and logging.'
        });
      }

      return recommendations;
    } catch (error) {
      logger.error('Error generating recommendations:', error);
      throw error;
    }
  }

  // Metrik ortalamasını hesapla
  calculateAverage(metricName) {
    try {
      const data = this.metrics.get(metricName);
      if (!data || data.length === 0) return 0;
      
      const sum = data.reduce((acc, item) => acc + item.value, 0);
      return sum / data.length;
    } catch (error) {
      logger.error(`Error calculating average for ${metricName}:`, error);
      throw error;
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();
export { PerformanceMonitor };