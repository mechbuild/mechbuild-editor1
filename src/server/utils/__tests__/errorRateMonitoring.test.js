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

describe('Error Rate Monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitor.metrics.clear();
    performanceMonitor.alerts.clear();
  });

  it('should monitor error rate', () => {
    const result = performanceMonitor.monitorErrorRate(100, 5);

    expect(result).toBe(0.05);
    expect(performanceMonitor.metrics.get('error_rate')).toHaveLength(1);
  });

  it('should trigger alert when error rate exceeds threshold', () => {
    performanceMonitor.monitorErrorRate(100, 10);

    expect(performanceMonitor.alerts.size).toBeGreaterThan(0);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should handle error rate monitoring with zero total requests', () => {
    const result = performanceMonitor.monitorErrorRate(0, 0);

    expect(result).toBe(0);
    expect(performanceMonitor.metrics.get('error_rate')[0].value).toBe(0);
  });

  it('should handle error rate monitoring with zero errors', () => {
    const result = performanceMonitor.monitorErrorRate(100, 0);

    expect(result).toBe(0);
    expect(performanceMonitor.metrics.get('error_rate')[0].value).toBe(0);
  });

  it('should handle error rate monitoring with all errors', () => {
    const result = performanceMonitor.monitorErrorRate(100, 100);

    expect(result).toBe(1);
    expect(performanceMonitor.metrics.get('error_rate')[0].value).toBe(1);
  });

  it('should handle error rate monitoring with more errors than total requests', () => {
    const result = performanceMonitor.monitorErrorRate(100, 150);

    expect(result).toBe(1);
    expect(performanceMonitor.metrics.get('error_rate')[0].value).toBe(1);
  });

  it('should handle error rate monitoring with negative values', () => {
    const result = performanceMonitor.monitorErrorRate(-100, -5);

    expect(result).toBe(0);
    expect(performanceMonitor.metrics.get('error_rate')[0].value).toBe(0);
  });

  it('should handle error rate monitoring with non-numeric values', () => {
    const result = performanceMonitor.monitorErrorRate('100', '5');

    expect(result).toBe(0.05);
    expect(performanceMonitor.metrics.get('error_rate')[0].value).toBe(0.05);
  });

  it('should handle error rate monitoring with invalid values', () => {
    const result = performanceMonitor.monitorErrorRate('invalid', 'invalid');

    expect(result).toBe(0);
    expect(performanceMonitor.metrics.get('error_rate')[0].value).toBe(0);
  });
}); 