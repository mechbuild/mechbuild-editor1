import { PerformanceMonitor } from '../performanceMonitor';
import { metrics } from '../metrics';
import { logger } from '../logger';
import { performance } from 'perf_hooks';

jest.mock('../metrics');
jest.mock('../logger');
jest.mock('perf_hooks', () => ({
  performance: {
    now: jest.fn()
  }
}));

describe('PerformanceMonitor', () => {
  let monitor;
  let mockProcess;

  beforeEach(() => {
    jest.clearAllMocks();
    monitor = new PerformanceMonitor();
    
    // Mock process.cpuUsage
    mockProcess = {
      cpuUsage: jest.fn(),
      memoryUsage: jest.fn()
    };
    global.process = mockProcess;
    
    // Mock performance.now
    performance.now.mockImplementation(() => Date.now());
  });

  describe('CPU Monitoring', () => {
    it('should monitor CPU usage correctly', () => {
      mockProcess.cpuUsage
        .mockReturnValueOnce({ user: 0, system: 0 })
        .mockReturnValueOnce({ user: 50000, system: 50000 });
      
      performance.now
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(1000);

      const cpuMonitor = monitor.monitorCPU();
      const cpuPercent = cpuMonitor.stop();

      expect(cpuPercent).toBe(10); // (100000 / 1000) * 100 = 10%
      expect(mockProcess.cpuUsage).toHaveBeenCalledTimes(2);
    });
  });

  describe('Memory Monitoring', () => {
    it('should monitor memory usage correctly', () => {
      mockProcess.memoryUsage.mockReturnValue({
        heapUsed: 50,
        heapTotal: 100
      });

      const memoryPercent = monitor.monitorMemory();

      expect(memoryPercent).toBe(50);
      expect(mockProcess.memoryUsage).toHaveBeenCalledTimes(1);
    });
  });

  describe('Response Time Monitoring', () => {
    it('should monitor response time correctly', () => {
      performance.now
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1500);

      const responseMonitor = monitor.monitorResponseTime();
      const duration = responseMonitor.stop();

      expect(duration).toBe(500);
    });
  });

  describe('Error Rate Monitoring', () => {
    it('should monitor error rate correctly', () => {
      const errorRate = monitor.monitorErrorRate(100, 5);
      expect(errorRate).toBe(0.05);
    });

    it('should throw error when total requests is zero', () => {
      expect(() => monitor.monitorErrorRate(0, 5)).toThrow('Total requests cannot be zero');
    });
  });

  describe('Metric Recording', () => {
    it('should record metrics correctly', () => {
      const timestamp = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(timestamp);

      monitor.recordMetric('cpu_usage', 50, { server: 'test' });

      expect(metrics.record).toHaveBeenCalledWith('cpu_usage', 50, { server: 'test' });
    });

    it('should throw error for invalid metric type', () => {
      expect(() => monitor.recordMetric('invalid_metric', 50)).toThrow('Invalid metric type: invalid_metric');
    });
  });

  describe('Alert Checking', () => {
    it('should create alert when threshold is exceeded', () => {
      const timestamp = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(timestamp);

      monitor.checkAlert('CPU', 90);

      expect(logger.warn).toHaveBeenCalled();
      const alerts = Array.from(monitor.alerts.values());
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toEqual({
        type: 'CPU',
        value: 90,
        threshold: 80,
        timestamp
      });
    });
  });

  describe('Report Generation', () => {
    beforeEach(() => {
      // Record some test metrics
      monitor.recordMetric('cpu_usage', 50);
      monitor.recordMetric('memory_usage', 60);
      monitor.recordMetric('response_time', 100);
      monitor.recordMetric('error_rate', 0.02);
    });

    it('should generate report with all sections', () => {
      const report = monitor.generateReport();
      
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('alerts');
      expect(report).toHaveProperty('recommendations');
    });

    it('should filter metrics by time range', () => {
      const startTime = Date.now() - 1000;
      const endTime = Date.now() + 1000;
      
      const report = monitor.generateReport({ startTime, endTime });
      
      expect(report.metrics).toBeDefined();
      Object.values(report.metrics).forEach(metricList => {
        metricList.forEach(metric => {
          expect(metric.timestamp).toBeGreaterThanOrEqual(startTime);
          expect(metric.timestamp).toBeLessThanOrEqual(endTime);
        });
      });
    });
  });
});