const { parentPort } = require('worker_threads');
const fs = require('fs').promises;
const path = require('path');
const ExcelJS = require('exceljs');
const { PDFDocument } = require('pdf-lib');
const logger = require('../utils/logger');

async function processFile(file, operations) {
  const results = [];
  let currentDoc = null;
  let currentBytes = null;

  try {
    // Dosyayı yükle
    currentBytes = await fs.readFile(file.path);
    
    // Dosya tipine göre işle
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      currentDoc = await processExcel(currentBytes);
    } else if (file.mimetype === 'application/pdf') {
      currentDoc = await PDFDocument.load(currentBytes);
    }

    // İşlemleri uygula
    for (const operation of operations) {
      const startTime = Date.now();
      try {
        switch (operation.type) {
          case 'compress':
            currentDoc = await applyCompression(currentDoc, operation.options);
            break;
          case 'protect':
            currentDoc = await applyProtection(currentDoc, operation.options);
            break;
          case 'watermark':
            currentDoc = await applyWatermark(currentDoc, operation.options);
            break;
          case 'extract':
            currentDoc = await extractPages(currentDoc, operation.options);
            break;
          case 'metadata':
            currentDoc = await applyMetadata(currentDoc, operation.options);
            break;
          case 'optimize':
            currentDoc = await optimizePdf(currentDoc, operation.options);
            break;
        }

        results.push({
          type: operation.type,
          success: true,
          duration: Date.now() - startTime
        });

        // İlerleme durumunu bildir
        parentPort.postMessage({
          type: 'progress',
          progress: (results.length / operations.length) * 100,
          operation: operation.type
        });
      } catch (error) {
        results.push({
          type: operation.type,
          success: false,
          error: error.message,
          duration: Date.now() - startTime
        });
      }
    }

    // İşlenmiş dosyayı kaydet
    const outputPath = path.join(__dirname, '../../uploads/processed', `processed-${Date.now()}-${file.originalname}`);
    await fs.writeFile(outputPath, await currentDoc.save());

    return {
      success: true,
      operations: results,
      outputPath
    };
  } catch (error) {
    logger.error('File processing failed', {
      filename: file.originalname,
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    // Geçici dosyaları temizle
    if (file.path) {
      await fs.unlink(file.path).catch(() => {});
    }
  }
}

// İşçi mesajlarını dinle
parentPort.on('message', async (message) => {
  if (message.type === 'process') {
    try {
      const result = await processFile(message.file, message.operations);
      parentPort.postMessage({
        type: 'result',
        ...result
      });
    } catch (error) {
      parentPort.postMessage({
        type: 'error',
        error: error.message
      });
    }
  }
}); 