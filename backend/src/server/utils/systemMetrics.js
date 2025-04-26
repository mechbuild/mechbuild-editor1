const os = require('os');
const { performanceMonitor } = require('./performanceMonitor');

class SystemMetrics {
  constructor() {
    this.cpuCount = os.cpus().length;
    this.totalMemory = os.totalmem();
  }

  collectMetrics() {
    try {
      // CPU Usage
      const cpuUsage = os.loadavg()[0] / this.cpuCount * 100;
      performanceMonitor.recordMetric('cpu', cpuUsage);

      // Memory Usage
      const freeMemory = os.freemem();
      const usedMemory = this.totalMemory - freeMemory;
      const memoryUsage = (usedMemory / this.totalMemory) * 100;
      performanceMonitor.recordMetric('memory', memoryUsage);

      // System Uptime
      const uptime = os.uptime();
      performanceMonitor.recordMetric('uptime', uptime);

      return {
        cpu: cpuUsage,
        memory: memoryUsage,
        uptime: uptime
      };
    } catch (error) {
      console.error('Error collecting system metrics:', error);
      return null;
    }
  }

  getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      hostname: os.hostname(),
      cpuCount: this.cpuCount,
      totalMemory: this.totalMemory,
      uptime: os.uptime()
    };
  }
}

module.exports = {
  systemMetrics: new SystemMetrics()
}; 