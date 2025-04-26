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

describe('Response Time Monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitor.metrics.clear();
    performanceMonitor.alerts.clear();
  });

  it('should monitor response time', () => {
    const monitor = performanceMonitor.monitorResponseTime();
    const result = monitor.stop();

    expect(typeof result).toBe('number');
    expect(performanceMonitor.metrics.get('response_time')).toHaveLength(1);
  });

  it('should trigger alert when response time exceeds threshold', () => {
    const monitor = performanceMonitor.monitorResponseTime();
    const now = Date.now();
    jest.spyOn(performance, 'now')
      .mockReturnValueOnce(now)
      .mockReturnValueOnce(now + 2000);

    monitor.stop();

    expect(performanceMonitor.alerts.size).toBeGreaterThan(0);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should handle response time monitoring with zero duration', () => {
    const monitor = performanceMonitor.monitorResponseTime();
    const now = Date.now();
    jest.spyOn(performance, 'now')
      .mockReturnValueOnce(now)
      .mockReturnValueOnce(now);

    const result = monitor.stop();

    expect(result).toBe(0);
    expect(performanceMonitor.metrics.get('response_time')[0].value).toBe(0);
  });

  it('should handle response time monitoring with negative duration', () => {
    const monitor = performanceMonitor.monitorResponseTime();
    const now = Date.now();
    jest.spyOn(performance, 'now')
      .mockReturnValueOnce(now)
      .mockReturnValueOnce(now - 1000);

    const result = monitor.stop();

    expect(result).toBeGreaterThanOrEqual(0);
    expect(performanceMonitor.metrics.get('response_time')[0].value).toBeGreaterThanOrEqual(0);
  });

  it('should handle response time monitoring with very long duration', () => {
    const monitor = performanceMonitor.monitorResponseTime();
    const now = Date.now();
    jest.spyOn(performance, 'now')
      .mockReturnValueOnce(now)
      .mockReturnValueOnce(now + 1000000);

    const result = monitor.stop();

    expect(result).toBeGreaterThan(0);
    expect(performanceMonitor.metrics.get('response_time')[0].value).toBeGreaterThan(0);
  });

  it('should handle response time monitoring with missing performance.now', () => {
    const originalPerformanceNow = performance.now;
    delete performance.now;

    const monitor = performanceMonitor.monitorResponseTime();
    const result = monitor.stop();

    expect(result).toBe(0);
    expect(performanceMonitor.metrics.get('response_time')).toHaveLength(1);

    performance.now = originalPerformanceNow;
  });

  it('should handle response time monitoring with invalid values', () => {
    const monitor = performanceMonitor.monitorResponseTime();
    jest.spyOn(performance, 'now')
      .mockReturnValueOnce('invalid')
      .mockReturnValueOnce('invalid');

    const result = monitor.stop();

    expect(result).toBe(0);
    expect(performanceMonitor.metrics.get('response_time')[0].value).toBe(0);
  });

  it('should handle response time monitoring with multiple stops', () => {
    const monitor = performanceMonitor.monitorResponseTime();
    const now = Date.now();
    jest.spyOn(performance, 'now')
      .mockReturnValueOnce(now)
      .mockReturnValueOnce(now + 1000);

    monitor.stop();
    const result = monitor.stop();

    expect(result).toBe(0);
    expect(performanceMonitor.metrics.get('response_time')).toHaveLength(1);
  });
}); 