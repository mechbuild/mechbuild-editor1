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

describe('Memory Monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitor.metrics.clear();
    performanceMonitor.alerts.clear();
  });

  it('should monitor memory usage', () => {
    const result = performanceMonitor.monitorMemory();

    expect(typeof result).toBe('number');
    expect(performanceMonitor.metrics.get('memory_usage')).toHaveLength(1);
  });

  it('should trigger alert when memory usage exceeds threshold', () => {
    jest.spyOn(process, 'memoryUsage').mockReturnValue({
      heapUsed: 900000000,
      heapTotal: 1000000000
    });

    performanceMonitor.monitorMemory();

    expect(performanceMonitor.alerts.size).toBeGreaterThan(0);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should handle memory monitoring with zero usage', () => {
    jest.spyOn(process, 'memoryUsage').mockReturnValue({
      heapUsed: 0,
      heapTotal: 1000000000
    });

    const result = performanceMonitor.monitorMemory();

    expect(result).toBe(0);
    expect(performanceMonitor.metrics.get('memory_usage')[0].value).toBe(0);
  });

  it('should handle memory monitoring with full usage', () => {
    jest.spyOn(process, 'memoryUsage').mockReturnValue({
      heapUsed: 1000000000,
      heapTotal: 1000000000
    });

    const result = performanceMonitor.monitorMemory();

    expect(result).toBe(100);
    expect(performanceMonitor.metrics.get('memory_usage')[0].value).toBe(100);
  });

  it('should handle memory monitoring with negative values', () => {
    jest.spyOn(process, 'memoryUsage').mockReturnValue({
      heapUsed: -1000,
      heapTotal: 1000000000
    });

    const result = performanceMonitor.monitorMemory();

    expect(result).toBeGreaterThanOrEqual(0);
    expect(performanceMonitor.metrics.get('memory_usage')[0].value).toBeGreaterThanOrEqual(0);
  });

  it('should handle memory monitoring with missing process.memoryUsage', () => {
    const originalMemoryUsage = process.memoryUsage;
    delete process.memoryUsage;

    const result = performanceMonitor.monitorMemory();

    expect(result).toBe(0);
    expect(performanceMonitor.metrics.get('memory_usage')).toHaveLength(1);

    process.memoryUsage = originalMemoryUsage;
  });

  it('should handle memory monitoring with invalid values', () => {
    jest.spyOn(process, 'memoryUsage').mockReturnValue({
      heapUsed: 'invalid',
      heapTotal: 'invalid'
    });

    const result = performanceMonitor.monitorMemory();

    expect(result).toBe(0);
    expect(performanceMonitor.metrics.get('memory_usage')[0].value).toBe(0);
  });
}); 