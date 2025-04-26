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

describe('Average Calculation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitor.metrics.clear();
    performanceMonitor.alerts.clear();
  });

  it('should calculate average of metrics', () => {
    performanceMonitor.recordMetric('test_metric', 10);
    performanceMonitor.recordMetric('test_metric', 20);
    performanceMonitor.recordMetric('test_metric', 30);

    const average = performanceMonitor.calculateAverage('test_metric');
    expect(average).toBe(20);
  });

  it('should return 0 for non-existent metrics', () => {
    const average = performanceMonitor.calculateAverage('non_existent');
    expect(average).toBe(0);
  });

  it('should handle single metric', () => {
    performanceMonitor.recordMetric('test_metric', 10);

    const average = performanceMonitor.calculateAverage('test_metric');
    expect(average).toBe(10);
  });

  it('should handle metrics with zero values', () => {
    performanceMonitor.recordMetric('test_metric', 0);
    performanceMonitor.recordMetric('test_metric', 0);
    performanceMonitor.recordMetric('test_metric', 0);

    const average = performanceMonitor.calculateAverage('test_metric');
    expect(average).toBe(0);
  });

  it('should handle metrics with negative values', () => {
    performanceMonitor.recordMetric('test_metric', -10);
    performanceMonitor.recordMetric('test_metric', -20);
    performanceMonitor.recordMetric('test_metric', -30);

    const average = performanceMonitor.calculateAverage('test_metric');
    expect(average).toBe(-20);
  });

  it('should handle metrics with mixed positive and negative values', () => {
    performanceMonitor.recordMetric('test_metric', -10);
    performanceMonitor.recordMetric('test_metric', 0);
    performanceMonitor.recordMetric('test_metric', 10);

    const average = performanceMonitor.calculateAverage('test_metric');
    expect(average).toBe(0);
  });

  it('should handle metrics with very large values', () => {
    performanceMonitor.recordMetric('test_metric', 1000000);
    performanceMonitor.recordMetric('test_metric', 2000000);
    performanceMonitor.recordMetric('test_metric', 3000000);

    const average = performanceMonitor.calculateAverage('test_metric');
    expect(average).toBe(2000000);
  });

  it('should handle metrics with decimal values', () => {
    performanceMonitor.recordMetric('test_metric', 1.5);
    performanceMonitor.recordMetric('test_metric', 2.5);
    performanceMonitor.recordMetric('test_metric', 3.5);

    const average = performanceMonitor.calculateAverage('test_metric');
    expect(average).toBe(2.5);
  });

  it('should handle metrics with non-numeric values', () => {
    performanceMonitor.recordMetric('test_metric', '10');
    performanceMonitor.recordMetric('test_metric', '20');
    performanceMonitor.recordMetric('test_metric', '30');

    const average = performanceMonitor.calculateAverage('test_metric');
    expect(average).toBe(20);
  });

  it('should handle metrics with invalid values', () => {
    performanceMonitor.recordMetric('test_metric', 'invalid');
    performanceMonitor.recordMetric('test_metric', null);
    performanceMonitor.recordMetric('test_metric', undefined);

    const average = performanceMonitor.calculateAverage('test_metric');
    expect(average).toBe(0);
  });
}); 