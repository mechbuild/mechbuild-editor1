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

describe('Metric Recording', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitor.metrics.clear();
    performanceMonitor.alerts.clear();
  });

  it('should record metrics with timestamp and tags', () => {
    const name = 'test_metric';
    const value = 100;
    const tags = { service: 'test' };

    performanceMonitor.recordMetric(name, value, tags);

    const recordedMetrics = performanceMonitor.metrics.get(name);
    expect(recordedMetrics).toHaveLength(1);
    expect(recordedMetrics[0]).toMatchObject({
      value,
      tags
    });
    expect(recordedMetrics[0].timestamp).toBeDefined();
    expect(metrics.record).toHaveBeenCalledWith(name, value, tags);
  });

  it('should handle multiple metrics with same name', () => {
    const name = 'test_metric';
    const values = [100, 200, 300];

    values.forEach(value => {
      performanceMonitor.recordMetric(name, value);
    });

    const recordedMetrics = performanceMonitor.metrics.get(name);
    expect(recordedMetrics).toHaveLength(3);
    expect(recordedMetrics.map(m => m.value)).toEqual(values);
  });

  it('should handle metrics with different tags', () => {
    const name = 'test_metric';
    const tags1 = { service: 'service1' };
    const tags2 = { service: 'service2' };

    performanceMonitor.recordMetric(name, 100, tags1);
    performanceMonitor.recordMetric(name, 200, tags2);

    const recordedMetrics = performanceMonitor.metrics.get(name);
    expect(recordedMetrics).toHaveLength(2);
    expect(recordedMetrics[0].tags).toEqual(tags1);
    expect(recordedMetrics[1].tags).toEqual(tags2);
  });

  it('should handle metrics with empty tags', () => {
    const name = 'test_metric';
    const value = 100;

    performanceMonitor.recordMetric(name, value, {});

    const recordedMetrics = performanceMonitor.metrics.get(name);
    expect(recordedMetrics).toHaveLength(1);
    expect(recordedMetrics[0].tags).toEqual({});
  });

  it('should handle metrics with null or undefined values', () => {
    const name = 'test_metric';

    performanceMonitor.recordMetric(name, null);
    performanceMonitor.recordMetric(name, undefined);

    const recordedMetrics = performanceMonitor.metrics.get(name);
    expect(recordedMetrics).toHaveLength(2);
    expect(recordedMetrics[0].value).toBeNull();
    expect(recordedMetrics[1].value).toBeUndefined();
  });

  it('should handle metrics with non-numeric values', () => {
    const name = 'test_metric';
    const values = ['string', true, { object: 'value' }];

    values.forEach(value => {
      performanceMonitor.recordMetric(name, value);
    });

    const recordedMetrics = performanceMonitor.metrics.get(name);
    expect(recordedMetrics).toHaveLength(3);
    expect(recordedMetrics.map(m => m.value)).toEqual(values);
  });
}); 