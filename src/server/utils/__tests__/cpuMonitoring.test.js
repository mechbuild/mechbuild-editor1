const { performance } = require('perf_hooks');
const { PerformanceMonitor } = require('../performanceMonitor');

// Mock the metrics module
jest.mock('../metrics', () => ({
  record: jest.fn(),
  alert: jest.fn()
}));

// Mock the logger module
jest.mock('../logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('CPU Monitoring', () => {
  let monitor;
  let mockMetrics;
  let mockLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    monitor = new PerformanceMonitor();
    mockMetrics = require('../metrics');
    mockLogger = require('../logger');
    
    // Mock performance.now
    const mockNow = jest.spyOn(performance, 'now');
    mockNow.mockImplementation(() => 1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should monitor CPU usage correctly', () => {
    // Start monitoring
    monitor.startCPUMonitoring();
    
    // Simulate some CPU usage
    performance.now.mockReturnValueOnce(2000);
    
    // Stop monitoring
    monitor.stopCPUMonitoring();

    // Verify metrics were recorded
    expect(mockMetrics.record).toHaveBeenCalledWith(
      'cpu_usage',
      expect.any(Number),
      expect.any(Object)
    );
  });

  test('should record CPU metrics', () => {
    monitor.startCPUMonitoring();
    performance.now.mockReturnValueOnce(3000);
    monitor.stopCPUMonitoring();

    expect(mockMetrics.record).toHaveBeenCalledWith(
      'cpu_usage',
      expect.any(Number),
      expect.objectContaining({
        type: 'system'
      })
    );
  });

  test('should trigger alert when CPU usage exceeds threshold', () => {
    // Set up high CPU usage scenario
    monitor.startCPUMonitoring();
    performance.now.mockReturnValueOnce(20000); // Simulate high CPU usage
    monitor.stopCPUMonitoring();

    expect(mockMetrics.alert).toHaveBeenCalledWith(
      'high_cpu_usage',
      expect.any(Number),
      expect.any(Object)
    );
  });

  test('should not trigger alert when CPU usage is below threshold', () => {
    monitor.startCPUMonitoring();
    performance.now.mockReturnValueOnce(1100); // Simulate low CPU usage
    monitor.stopCPUMonitoring();

    expect(mockMetrics.alert).not.toHaveBeenCalled();
  });

  test('should handle zero CPU usage', () => {
    monitor.startCPUMonitoring();
    performance.now.mockReturnValueOnce(1000); // Same time = 0 CPU usage
    monitor.stopCPUMonitoring();

    expect(mockMetrics.record).toHaveBeenCalledWith(
      'cpu_usage',
      0,
      expect.any(Object)
    );
  });
}); 