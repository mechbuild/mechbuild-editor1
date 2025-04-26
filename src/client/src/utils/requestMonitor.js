import { logger } from './logger';

class RequestMonitor {
    constructor() {
        this.requests = new Map();
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            totalResponseTime: 0
        };
    }

    startRequest(requestId, url, method) {
        const startTime = Date.now();
        this.requests.set(requestId, {
            url,
            method,
            startTime,
            status: 'pending'
        });
        this.stats.totalRequests++;
    }

    endRequest(requestId, status, responseTime) {
        const request = this.requests.get(requestId);
        if (!request) {
            logger.warn(`Request ${requestId} not found in monitor`);
            return;
        }

        request.status = status;
        request.endTime = Date.now();
        request.responseTime = responseTime;

        // Update stats
        if (status >= 200 && status < 300) {
            this.stats.successfulRequests++;
        } else {
            this.stats.failedRequests++;
        }

        this.stats.totalResponseTime += responseTime;
        this.stats.averageResponseTime = 
            this.stats.totalResponseTime / this.stats.totalRequests;

        // Log request details
        logger.info(`Request completed: ${request.method} ${request.url}`, {
            requestId,
            status,
            responseTime,
            timestamp: new Date().toISOString()
        });

        // Clean up old requests (keep last 100)
        if (this.requests.size > 100) {
            const oldestRequestId = Array.from(this.requests.keys())[0];
            this.requests.delete(oldestRequestId);
        }
    }

    getRequestStats() {
        return {
            ...this.stats,
            activeRequests: this.requests.size
        };
    }

    getRequestDetails(requestId) {
        return this.requests.get(requestId);
    }

    getAllRequests() {
        return Array.from(this.requests.entries()).map(([id, details]) => ({
            id,
            ...details
        }));
    }

    reset() {
        this.requests.clear();
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            totalResponseTime: 0
        };
    }
}

export const requestMonitor = new RequestMonitor(); 