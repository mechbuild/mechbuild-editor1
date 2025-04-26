const express = require('express');
const router = express.Router();
const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const { auth } = require('../middleware/auth');
const { AppError } = require('../middleware/error');
const Project = require('../models/Project');

// AI sohbet
router.post('/chat', auth, async (req, res, next) => {
  try {
    const { message, projectId } = req.body;

    if (!message) {
      return next(new AppError('Mesaj gerekli', 400));
    }

    // Proje kontrolü
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        return next(new AppError('Proje bulunamadı', 404));
      }
    }

    // AI yanıtı oluştur
    const response = {
      message: 'AI yanıtı buraya gelecek',
      timestamp: new Date().toISOString()
    };

    res.json({
      status: 'success',
      data: response
    });
  } catch (error) {
    next(error);
  }
});

// Komut işleme
router.post('/command', auth, async (req, res, next) => {
  try {
    const { command, projectId } = req.body;

    if (!command) {
      return next(new AppError('Komut gerekli', 400));
    }

    // Proje kontrolü
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        return next(new AppError('Proje bulunamadı', 404));
      }
    }

    // Komut işleme
    const result = {
      command,
      result: 'Komut işleme sonucu buraya gelecek',
      timestamp: new Date().toISOString()
    };

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// PDF analizi
router.post('/analyze-pdf', auth, async (req, res, next) => {
  try {
    const { projectId, filePath } = req.body;

    if (!projectId || !filePath) {
      return next(new AppError('Proje ID ve dosya yolu gerekli', 400));
    }

    // Proje kontrolü
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Proje bulunamadı', 404));
    }

    // PDF dosyasını oku
    const pdfBytes = await fs.readFile(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Sayfa sayısı
    const pageCount = pdfDoc.getPageCount();
    
    // Metin çıkarma
    let textContent = '';
    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i);
      const text = await page.getText();
      textContent += text;
    }

    // Anahtar kelime analizi
    const keywords = ['yangın', 'HVAC', 'mekanik', 'elektrik', 'tesisat'];
    const keywordsFound = {};
    
    keywords.forEach(keyword => {
      keywordsFound[keyword] = textContent.toLowerCase().includes(keyword.toLowerCase());
    });

    const analysis = {
      pageCount,
      textLength: textContent.length,
      keywordsFound
    };

    // Projeye log ekle
    project.logs.push({
      action: 'pdf_analysis',
      details: 'PDF analizi yapıldı',
      timestamp: Date.now()
    });
    await project.save();

    res.json({
      status: 'success',
      data: { analysis }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 