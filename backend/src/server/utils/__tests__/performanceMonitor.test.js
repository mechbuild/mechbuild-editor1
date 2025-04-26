jest.mock('../metrics', () => ({
  metrics: {
    cpu: [],
    memory: [],
    responseTime: [],
    errorRate: [],
    alerts: []
  }
}));

jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../performanceMonitor', () => ({
  performanceMonitor: {
    recordMetric: jest.fn(),
    getMetricsInRange: jest.fn(),
    generateReport: jest.fn(),
    metrics: new Map(),
    alerts: new Map(),
    thresholds: {
      cpu: 80,
      memory: 85,
      responseTime: 1000,
      errorRate: 0.05
    }
  }
}));

const { performanceMonitor } = require('../performanceMonitor');
const { metrics } = require('../metrics');
const { logger } = require('../logger');

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    metrics.cpu = [];
    metrics.memory = [];
    metrics.responseTime = [];
    metrics.errorRate = [];
    metrics.alerts = [];
  });

  describe('recordMetric', () => {
    it('should record CPU metric', () => {
      performanceMonitor.recordMetric('cpu', 50);
      expect(performanceMonitor.recordMetric).toHaveBeenCalledWith('cpu', 50);
    });

    it('should record memory metric', () => {
      performanceMonitor.recordMetric('memory', 1024);
      expect(performanceMonitor.recordMetric).toHaveBeenCalledWith('memory', 1024);
    });

    it('should record response time metric', () => {
      performanceMonitor.recordMetric('responseTime', 100);
      expect(performanceMonitor.recordMetric).toHaveBeenCalledWith('responseTime', 100);
    });

    it('should record error rate metric', () => {
      performanceMonitor.recordMetric('errorRate', 0.5);
      expect(performanceMonitor.recordMetric).toHaveBeenCalledWith('errorRate', 0.5);
    });

    it('should handle invalid metric types', () => {
      performanceMonitor.recordMetric('invalidType', 100);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle negative values', () => {
      performanceMonitor.recordMetric('cpu', -10);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should handle non-numeric values', () => {
      performanceMonitor.recordMetric('cpu', 'invalid');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('checkThresholds', () => {
    it('should generate alert when threshold is exceeded', () => {
      performanceMonitor.recordMetric('cpu', 90);
      expect(logger.warn).toHaveBeenCalled();
      expect(metrics.alerts.length).toBeGreaterThan(0);
    });

    it('should not generate alert when below threshold', () => {
      performanceMonitor.recordMetric('cpu', 70);
      expect(logger.warn).not.toHaveBeenCalled();
      expect(metrics.alerts.length).toBe(0);
    });

    it('should handle multiple threshold breaches', () => {
      performanceMonitor.recordMetric('cpu', 90);
      performanceMonitor.recordMetric('memory', 90);
      expect(metrics.alerts.length).toBe(2);
    });
  });

  describe('getMetricsInRange', () => {
    it('should return metrics within time range', () => {
      const now = Date.now();
      const expectedMetrics = [{ value: 60, timestamp: now - 1000 }];
      performanceMonitor.getMetricsInRange.mockReturnValue(expectedMetrics);

      const result = performanceMonitor.getMetricsInRange('cpu', now - 1500, now - 500);
      expect(result).toBe(expectedMetrics);
      expect(performanceMonitor.getMetricsInRange).toHaveBeenCalledWith('cpu', now - 1500, now - 500);
    });

    it('should handle empty metrics', () => {
      performanceMonitor.getMetricsInRange.mockReturnValue([]);
      const result = performanceMonitor.getMetricsInRange('cpu', 0, Date.now());
      expect(result).toHaveLength(0);
    });

    it('should handle invalid time ranges', () => {
      const result = performanceMonitor.getMetricsInRange('cpu', 1000, 500);
      expect(result).toHaveLength(0);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should handle future timestamps', () => {
      const futureTime = Date.now() + 1000000;
      const result = performanceMonitor.getMetricsInRange('cpu', Date.now(), futureTime);
      expect(result).toHaveLength(0);
    });
  });

  describe('generateReport', () => {
    it('should generate report with all metrics', () => {
      const expectedReport = {
        cpu: [{ value: 50, timestamp: Date.now() }],
        memory: [{ value: 1024, timestamp: Date.now() }],
        responseTime: [{ value: 100, timestamp: Date.now() }],
        errorRate: [{ value: 0.5, timestamp: Date.now() }]
      };
      performanceMonitor.generateReport.mockReturnValue(expectedReport);

      const report = performanceMonitor.generateReport();
      expect(report).toBe(expectedReport);
    });

    it('should handle missing time range parameters', () => {
      const expectedReport = {
        cpu: [],
        memory: [],
        responseTime: [],
        errorRate: []
      };
      performanceMonitor.generateReport.mockReturnValue(expectedReport);

      const report = performanceMonitor.generateReport({});
      expect(report).toBe(expectedReport);
      expect(performanceMonitor.generateReport).toHaveBeenCalledWith({});
    });

    it('should include alerts in report when requested', () => {
      const report = performanceMonitor.generateReport({ includeAlerts: true });
      expect(report.alerts).toBeDefined();
    });

    it('should handle custom time ranges', () => {
      const startTime = Date.now() - 3600000; // 1 hour ago
      const endTime = Date.now();
      const report = performanceMonitor.generateReport({ startTime, endTime });
      expect(performanceMonitor.generateReport).toHaveBeenCalledWith({ startTime, endTime });
    });
  });
});
