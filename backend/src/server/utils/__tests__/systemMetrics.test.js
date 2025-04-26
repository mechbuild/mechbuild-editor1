jest.mock('os', () => ({
  cpus: () => [{}, {}, {}], // 3 CPUs
  totalmem: () => 8589934592, // 8GB
  freemem: () => 4294967296, // 4GB
  loadavg: () => [1.5, 1.2, 1.0],
  uptime: () => 3600,
  platform: () => 'linux',
  arch: () => 'x64',
  release: () => '5.4.0-42-generic',
  hostname: () => 'test-server'
}));

jest.mock('../performanceMonitor', () => ({
  performanceMonitor: {
    recordMetric: jest.fn()
  }
}));

const { systemMetrics } = require('../systemMetrics');
const { performanceMonitor } = require('../performanceMonitor');

describe('SystemMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct CPU count and total memory', () => {
      expect(systemMetrics.cpuCount).toBe(3);
      expect(systemMetrics.totalMemory).toBe(8589934592);
    });
  });

  describe('collectMetrics', () => {
    it('should collect and record CPU metrics', () => {
      systemMetrics.collectMetrics();
      expect(performanceMonitor.recordMetric).toHaveBeenCalledWith('cpu', expect.any(Number));
    });

    it('should collect and record memory metrics', () => {
      systemMetrics.collectMetrics();
      expect(performanceMonitor.recordMetric).toHaveBeenCalledWith('memory', expect.any(Number));
    });

    it('should collect and record uptime metrics', () => {
      systemMetrics.collectMetrics();
      expect(performanceMonitor.recordMetric).toHaveBeenCalledWith('uptime', expect.any(Number));
    });

    it('should return collected metrics', () => {
      const metrics = systemMetrics.collectMetrics();
      expect(metrics).toEqual({
        cpu: expect.any(Number),
        memory: expect.any(Number),
        uptime: expect.any(Number)
      });
    });

    it('should handle errors gracefully', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(performanceMonitor, 'recordMetric').mockImplementation(() => {
        throw new Error('Test error');
      });

      const result = systemMetrics.collectMetrics();
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getSystemInfo', () => {
    it('should return complete system information', () => {
      const info = systemMetrics.getSystemInfo();
      expect(info).toEqual({
        platform: 'linux',
        arch: 'x64',
        release: '5.4.0-42-generic',
        hostname: 'test-server',
        cpuCount: 3,
        totalMemory: 8589934592,
        uptime: 3600
      });
    });
  });
}); 