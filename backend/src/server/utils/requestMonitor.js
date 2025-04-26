const { performanceMonitor } = require('./performanceMonitor');
const { errorHandler } = require('./errorHandler');

class RequestMonitor {
  constructor() {
    this.requestCount = 0;
    this.activeRequests = new Map();
  }

  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      const requestId = ++this.requestCount;
      
      // Store request info
      this.activeRequests.set(requestId, {
        method: req.method,
        path: req.path,
        startTime,
        status: 'processing'
      });

      // Response interceptor
      const originalSend = res.send;
      res.send = function(body) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Record response time
        performanceMonitor.recordMetric('responseTime', duration);
        
        // Update request status
        const requestInfo = this.activeRequests.get(requestId);
        requestInfo.status = 'completed';
        requestInfo.duration = duration;
        requestInfo.statusCode = res.statusCode;
        
        // Clean up
        this.activeRequests.delete(requestId);
        
        return originalSend.call(this, body);
      }.bind(this);

      // Error handling
      res.on('error', (error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Record error
        errorHandler.handleError(error, {
          requestId,
          method: req.method,
          path: req.path,
          duration
        });
        
        // Update request status
        const requestInfo = this.activeRequests.get(requestId);
        requestInfo.status = 'error';
        requestInfo.duration = duration;
        requestInfo.error = error.message;
        
        // Clean up
        this.activeRequests.delete(requestId);
      });

      next();
    };
  }

  getActiveRequests() {
    return Array.from(this.activeRequests.entries()).map(([id, info]) => ({
      id,
      ...info
    }));
  }

  getRequestStats() {
    const active = this.activeRequests.size;
    const completed = this.requestCount - active;
    
    return {
      total: this.requestCount,
      active,
      completed,
      averageResponseTime: this.calculateAverageResponseTime()
    };
  }

  calculateAverageResponseTime() {
    const completedRequests = Array.from(this.activeRequests.values())
      .filter(req => req.status === 'completed' && req.duration);
    
    if (completedRequests.length === 0) return 0;
    
    const totalDuration = completedRequests.reduce((sum, req) => sum + req.duration, 0);
    return totalDuration / completedRequests.length;
  }
}

module.exports = {
  requestMonitor: new RequestMonitor()
}; 