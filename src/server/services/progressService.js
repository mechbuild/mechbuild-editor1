const EventEmitter = require('events');
const logger = require('../utils/logger');
const cacheService = require('./cacheService');

class ProgressService extends EventEmitter {
  constructor() {
    super();
    this.operations = new Map();
  }

  async createOperation(operationId, totalSteps, metadata = {}) {
    const operation = {
      id: operationId,
      totalSteps,
      currentStep: 0,
      progress: 0,
      status: 'running',
      startTime: Date.now(),
      metadata,
      steps: []
    };

    this.operations.set(operationId, operation);
    await cacheService.set(`progress:${operationId}`, operation);

    this.emit('operationCreated', operation);
    logger.info('Operation created', { operationId, metadata });

    return operation;
  }

  async updateProgress(operationId, step, message, data = {}) {
    const operation = this.operations.get(operationId);
    if (!operation) {
      throw new Error('Operation not found');
    }

    operation.currentStep = step;
    operation.progress = Math.round((step / operation.totalSteps) * 100);
    operation.steps.push({
      step,
      message,
      timestamp: Date.now(),
      data
    });

    // Son 10 adımı sakla
    if (operation.steps.length > 10) {
      operation.steps = operation.steps.slice(-10);
    }

    await cacheService.set(`progress:${operationId}`, operation);

    this.emit('progressUpdated', {
      operationId,
      progress: operation.progress,
      step,
      message,
      data
    });

    logger.info('Progress updated', {
      operationId,
      progress: operation.progress,
      step,
      message
    });

    return operation;
  }

  async completeOperation(operationId, result = {}) {
    const operation = this.operations.get(operationId);
    if (!operation) {
      throw new Error('Operation not found');
    }

    operation.status = 'completed';
    operation.endTime = Date.now();
    operation.duration = operation.endTime - operation.startTime;
    operation.result = result;

    await cacheService.set(`progress:${operationId}`, operation, 3600); // 1 saat sakla

    this.emit('operationCompleted', operation);
    logger.info('Operation completed', {
      operationId,
      duration: operation.duration,
      result
    });

    return operation;
  }

  async failOperation(operationId, error) {
    const operation = this.operations.get(operationId);
    if (!operation) {
      throw new Error('Operation not found');
    }

    operation.status = 'failed';
    operation.endTime = Date.now();
    operation.duration = operation.endTime - operation.startTime;
    operation.error = {
      message: error.message,
      stack: error.stack,
      code: error.code
    };

    await cacheService.set(`progress:${operationId}`, operation, 3600);

    this.emit('operationFailed', operation);
    logger.error('Operation failed', {
      operationId,
      duration: operation.duration,
      error: operation.error
    });

    return operation;
  }

  async getOperationStatus(operationId) {
    const cachedOperation = await cacheService.get(`progress:${operationId}`);
    if (cachedOperation) {
      return cachedOperation;
    }

    const operation = this.operations.get(operationId);
    if (!operation) {
      throw new Error('Operation not found');
    }

    return operation;
  }

  async cancelOperation(operationId) {
    const operation = this.operations.get(operationId);
    if (!operation) {
      throw new Error('Operation not found');
    }

    operation.status = 'cancelled';
    operation.endTime = Date.now();
    operation.duration = operation.endTime - operation.startTime;

    await cacheService.set(`progress:${operationId}`, operation, 3600);

    this.emit('operationCancelled', operation);
    logger.info('Operation cancelled', {
      operationId,
      duration: operation.duration
    });

    return operation;
  }

  async cleanupOldOperations() {
    const now = Date.now();
    for (const [operationId, operation] of this.operations) {
      if (operation.status !== 'running' && (now - operation.endTime) > 3600000) {
        this.operations.delete(operationId);
        await cacheService.delete(`progress:${operationId}`);
      }
    }
  }
}

module.exports = new ProgressService(); 