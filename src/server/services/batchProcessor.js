const logger = require('../utils/logger');
const cacheService = require('./cacheService');
const { Worker } = require('worker_threads');

class BatchProcessor {
  constructor() {
    this.workers = new Map();
    this.maxWorkers = 4; // Maksimum eşzamanlı işçi sayısı
  }

  async processBatch(files, operations, progressCallback) {
    const batchId = Date.now().toString();
    const results = [];
    const totalFiles = files.length;
    const totalOperations = operations.length;

    // İşçi havuzu oluştur
    const availableWorkers = [];
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker('./src/server/workers/fileProcessor.js');
      availableWorkers.push(worker);
      this.workers.set(worker.threadId, worker);
    }

    try {
      // Dosyaları işçilere dağıt
      const filePromises = files.map(async (file, fileIndex) => {
        const worker = availableWorkers[fileIndex % this.maxWorkers];
        const fileResult = {
          filename: file.originalname,
          operations: [],
          progress: 0
        };

        return new Promise((resolve, reject) => {
          worker.postMessage({
            type: 'process',
            file,
            operations,
            batchId,
            fileIndex
          });

          worker.on('message', (message) => {
            if (message.type === 'progress') {
              fileResult.progress = message.progress;
              if (progressCallback) {
                progressCallback({
                  batchId,
                  fileIndex,
                  progress: message.progress,
                  currentOperation: message.operation
                });
              }
            } else if (message.type === 'result') {
              fileResult.operations = message.operations;
              fileResult.exportUrl = message.exportUrl;
              resolve(fileResult);
            }
          });

          worker.on('error', reject);
          worker.on('exit', (code) => {
            if (code !== 0) {
              reject(new Error(`Worker stopped with exit code ${code}`));
            }
          });
        });
      });

      // Tüm dosyaların işlenmesini bekle
      const batchResults = await Promise.all(filePromises);
      results.push(...batchResults);

      // İşçileri temizle
      for (const worker of availableWorkers) {
        worker.terminate();
        this.workers.delete(worker.threadId);
      }

      // Sonuçları önbelleğe al
      await cacheService.set(`batch:${batchId}`, results, 3600);

      return {
        success: true,
        batchId,
        results,
        summary: {
          totalFiles,
          totalOperations,
          successRate: results.filter(r => r.operations.every(o => o.success)).length / totalFiles
        }
      };
    } catch (error) {
      logger.error('Batch processing failed', {
        batchId,
        error: error.message,
        stack: error.stack
      });

      // Hata durumunda işçileri temizle
      for (const worker of availableWorkers) {
        worker.terminate();
        this.workers.delete(worker.threadId);
      }

      throw error;
    }
  }

  async getBatchStatus(batchId) {
    const cachedResults = await cacheService.get(`batch:${batchId}`);
    if (cachedResults) {
      return {
        batchId,
        status: 'completed',
        results: cachedResults
      };
    }
    return {
      batchId,
      status: 'not_found'
    };
  }

  async cancelBatch(batchId) {
    // İşçileri durdur ve temizle
    for (const [threadId, worker] of this.workers) {
      worker.terminate();
      this.workers.delete(threadId);
    }

    // Önbelleği temizle
    await cacheService.delete(`batch:${batchId}`);

    return {
      success: true,
      message: 'Batch işlemi iptal edildi.'
    };
  }
}

module.exports = new BatchProcessor(); 