// src/services/performance.js

import fs from 'fs';
import path from 'path';
import { AppError, handleError } from './errorHandler';

// Performans metriklerini topla
export function collectMetrics() {
  const metrics = {
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };

  return metrics;
}

// Performans loglarını kaydet
export async function logPerformance(metrics) {
  try {
    const logDir = '/mnt/data/logs/performance';
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.json`);
    const logData = JSON.stringify(metrics, null, 2) + '\n';

    fs.appendFileSync(logFile, logData);
  } catch (err) {
    return handleError(err);
  }
}

// Büyük dosyaları optimize et
export async function optimizeLargeFile(file) {
  try {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new AppError('Dosya boyutu çok büyük', 'error', 400);
    }

    // Dosya işleme performansını izle
    const startTime = process.hrtime();
    
    // Dosya işleme işlemleri burada yapılır
    
    const endTime = process.hrtime(startTime);
    const processingTime = (endTime[0] * 1000) + (endTime[1] / 1000000); // ms cinsinden

    return {
      status: 'success',
      processingTime,
      originalSize: file.size
    };
  } catch (err) {
    return handleError(err);
  }
}

// Bellek kullanımını optimize et
export function optimizeMemory() {
  try {
    if (global.gc) {
      global.gc();
    }

    const memoryUsage = process.memoryUsage();
    const memoryThreshold = 500 * 1024 * 1024; // 500MB

    if (memoryUsage.heapUsed > memoryThreshold) {
      console.warn('Yüksek bellek kullanımı tespit edildi');
      // Bellek temizleme işlemleri
    }

    return memoryUsage;
  } catch (err) {
    return handleError(err);
  }
}

// Ağ isteklerini optimize et
export function optimizeNetworkRequests() {
  try {
    // İstek önbellekleme
    const cache = new Map();
    const cacheTimeout = 5 * 60 * 1000; // 5 dakika

    return {
      cache,
      cacheTimeout,
      clearCache: () => cache.clear()
    };
  } catch (err) {
    return handleError(err);
  }
} 