import { performanceMonitor } from '../performanceMonitor';
import { logger } from '../logger';
import { metrics } from '../metrics';

jest.mock('../logger');
jest.mock('../metrics', () => ({
  metrics: {
    record: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
    getMetric: jest.fn(),
    clear: jest.fn()
  }
}));

describe('Report Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitor.metrics.clear();
    performanceMonitor.alerts.clear();
  });

  it('should generate summary report', () => {
    performanceMonitor.recordMetric('cpu_usage', 50);
    performanceMonitor.recordMetric('memory_usage', 60);
    performanceMonitor.recordMetric('response_time', 500);
    performanceMonitor.recordMetric('error_rate', 0.02);

    const summary = performanceMonitor.generateSummary();

    expect(summary).toHaveProperty('cpu');
    expect(summary).toHaveProperty('memory');
    expect(summary).toHaveProperty('responseTime');
    expect(summary).toHaveProperty('errorRate');
  });

  it('should get metrics in time range', () => {
    const startTime = Date.now() - 3600000; // 1 hour ago
    const endTime = Date.now();
    
    const metrics = performanceMonitor.getMetricsInRange(startTime, endTime);
    
    expect(metrics).toHaveProperty('cpu_usage');
    expect(metrics).toHaveProperty('memory_usage');
    expect(metrics).toHaveProperty('response_time');
    expect(metrics).toHaveProperty('error_rate');
  });

  it('should filter metrics by time range', () => {
    const now = Date.now();
    const startTime = now - 3600000; // 1 hour ago
    const endTime = now - 1800000; // 30 minutes ago

    // Mock Date.now() for recordMetric calls
    const dateSpy = jest.spyOn(Date, 'now');
    
    // Outside range (too old)
    dateSpy.mockReturnValueOnce(now - 4000000);
    performanceMonitor.recordMetric('test_metric', 10);
    
    // Inside range
    dateSpy.mockReturnValueOnce(now - 2000000);
    performanceMonitor.recordMetric('test_metric', 20);
    
    // Outside range (too new)
    dateSpy.mockReturnValueOnce(now - 1000000);
    performanceMonitor.recordMetric('test_metric', 30);

    const metrics = performanceMonitor.getMetricsInRange(startTime, endTime);
    expect(metrics['test_metric']).toHaveLength(1);
    expect(metrics['test_metric'][0].value).toBe(20);

    dateSpy.mockRestore();
  });

  it('should handle edge cases in time range filtering', () => {
    const now = Date.now();
    const dateSpy = jest.spyOn(Date, 'now');

    // Create metrics at specific times
    dateSpy.mockReturnValue(now);
    performanceMonitor.recordMetric('test_metric', 10); // at now
    dateSpy.mockReturnValue(now - 1000);
    performanceMonitor.recordMetric('test_metric', 20); // at now - 1000
    dateSpy.mockReturnValue(now - 2000);
    performanceMonitor.recordMetric('test_metric', 30); // at now - 2000

    // Test exact boundary conditions
    const metrics1 = performanceMonitor.getMetricsInRange(now - 2000, now);
    expect(metrics1['test_metric']).toHaveLength(3); // All metrics should be included

    const metrics2 = performanceMonitor.getMetricsInRange(now - 1000, now - 1000);
    expect(metrics2['test_metric']).toHaveLength(1); // Only the metric at now - 1000

    const metrics3 = performanceMonitor.getMetricsInRange(now - 1500, now - 500);
    expect(metrics3['test_metric']).toHaveLength(1); // Only the metric at now - 1000

    dateSpy.mockRestore();
  });

  it('should handle missing time range parameters', () => {
    const now = Date.now();
    const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(now);

    performanceMonitor.recordMetric('test_metric', 10);
    performanceMonitor.recordMetric('test_metric', 20);
    performanceMonitor.recordMetric('test_metric', 30);

    // Test with only startTime
    const metricsWithStartOnly = performanceMonitor.getMetricsInRange(now - 1000);
    expect(metricsWithStartOnly['test_metric']).toHaveLength(3);

    // Test with only endTime
    const metricsWithEndOnly = performanceMonitor.getMetricsInRange(null, now + 1000);
    expect(metricsWithEndOnly['test_metric']).toHaveLength(3);

    // Test with no time range
    const metricsWithNoTime = performanceMonitor.getMetricsInRange();
    expect(metricsWithNoTime['test_metric']).toHaveLength(3);

    dateSpy.mockRestore();
  });

  it('should filter alerts by time range', () => {
    const now = Date.now();
    const startTime = now - 3600000; // 1 hour ago
    const endTime = now - 1800000; // 30 minutes ago

    // Mock Date.now() for alert creation
    const dateSpy = jest.spyOn(Date, 'now');
    
    // Outside range (too new)
    dateSpy.mockReturnValue(now);
    performanceMonitor.monitorCPU().stop();
    
    // Inside range
    dateSpy.mockReturnValue(now - 2000000);
    performanceMonitor.monitorMemory();
    
    // Outside range (too old)
    dateSpy.mockReturnValue(now - 4000000);
    performanceMonitor.monitorErrorRate(100, 10);

    const alerts = performanceMonitor.getAlertsInRange(startTime, endTime);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].timestamp).toBe(now - 2000000);

    dateSpy.mockRestore();
  });

  it('should handle missing time range parameters for alerts', () => {
    const now = Date.now();
    const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(now);

    performanceMonitor.monitorCPU().stop();
    performanceMonitor.monitorMemory();
    performanceMonitor.monitorErrorRate(100, 10);

    // Test with only startTime
    const alertsWithStartOnly = performanceMonitor.getAlertsInRange(now - 1000);
    expect(alertsWithStartOnly).toHaveLength(3);

    // Test with only endTime
    const alertsWithEndOnly = performanceMonitor.getAlertsInRange(null, now + 1000);
    expect(alertsWithEndOnly).toHaveLength(3);

    // Test with no time range
    const alertsWithNoTime = performanceMonitor.getAlertsInRange();
    expect(alertsWithNoTime).toHaveLength(3);

    dateSpy.mockRestore();
  });

  it('should generate complete report with time range', () => {
    const now = Date.now();
    const startTime = now - 3600000; // 1 hour ago
    const endTime = now - 1800000; // 30 minutes ago

    const report = performanceMonitor.generateReport({ startTime, endTime });

    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('metrics');
    expect(report).toHaveProperty('alerts');
    expect(report).toHaveProperty('recommendations');
  });

  it('should generate report with default options', () => {
    const report = performanceMonitor.generateReport();

    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('metrics');
    expect(report).toHaveProperty('alerts');
    expect(report).toHaveProperty('recommendations');
  });

  it('should generate recommendations based on thresholds', () => {
    performanceMonitor.recordMetric('cpu_usage', 90);
    performanceMonitor.recordMetric('memory_usage', 90);
    performanceMonitor.recordMetric('response_time', 2000);
    performanceMonitor.recordMetric('error_rate', 0.1);

    const recommendations = performanceMonitor.generateRecommendations();

    expect(recommendations.length).toBeGreaterThan(0);
    recommendations.forEach(rec => {
      expect(rec).toHaveProperty('type');
      expect(rec).toHaveProperty('severity');
      expect(rec).toHaveProperty('message');
    });
  });
}); 