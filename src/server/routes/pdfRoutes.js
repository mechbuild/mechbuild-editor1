const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pdf = require('pdf-parse');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const Tesseract = require('tesseract.js');
const logger = require('../utils/logger');
const exportService = require('../services/exportService');
const { verifyToken } = require('../middleware');

// Supported OCR languages
const SUPPORTED_LANGUAGES = {
  'eng': 'English',
  'tur': 'Turkish',
  'deu': 'German',
  'fra': 'French',
  'spa': 'Spanish',
  'ita': 'Italian',
  'por': 'Portuguese',
  'rus': 'Russian',
  'ara': 'Arabic',
  'chi_sim': 'Chinese (Simplified)',
  'chi_tra': 'Chinese (Traditional)',
  'jpn': 'Japanese',
  'kor': 'Korean'
};

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/pdfs');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Sadece PDF dosyaları yüklenebilir.'), false);
    }
    cb(null, true);
  }
});

// PDF analysis endpoint
router.post('/analyze', verifyToken, upload.single('pdf'), async (req, res) => {
  const requestId = req.id;
  const startTime = Date.now();

  try {
    if (!req.file) {
      logger.warn('PDF analysis failed - no file uploaded', { requestId });
      return res.status(400).json({ error: 'PDF dosyası yüklenmedi.' });
    }

    const dataBuffer = await fs.readFile(req.file.path);
    const data = await pdf(dataBuffer);
    
    // Enhanced analysis
    const content = data.text.toLowerCase();
    const analysis = {
      metadata: data.metadata,
      pageCount: data.numpages,
      textLength: data.text.length,
      keywords: {
        yangın: content.includes('yangın'),
        hvac: content.includes('hvac'),
        mekanik: content.includes('mekanik'),
        elektrik: content.includes('elektrik'),
        tesisat: content.includes('tesisat')
      },
      stats: {
        wordCount: data.text.split(/\s+/).length,
        lineCount: data.text.split('\n').length,
        avgWordsPerPage: Math.round(data.text.split(/\s+/).length / data.numpages)
      }
    };

    // Export analysis results
    const exportResult = await exportService.exportToJSON(analysis, {
      filename: `pdf-analysis-${req.file.originalname}`
    });

    // Clean up the uploaded file
    await fs.unlink(req.file.path);

    logger.info('PDF analysis completed', {
      requestId,
      filename: req.file.originalname,
      analysis,
      duration: Date.now() - startTime
    });

    res.json({
      success: true,
      analysis,
      exportUrl: exportResult.url
    });
  } catch (error) {
    logger.error('PDF analysis failed', {
      requestId,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    });
    res.status(500).json({ error: 'PDF analizi sırasında bir hata oluştu.' });
  }
});

// PDF to Excel conversion endpoint
router.post('/convert-to-excel', verifyToken, upload.single('pdf'), async (req, res) => {
  const requestId = req.id;
  const startTime = Date.now();

  try {
    if (!req.file) {
      logger.warn('PDF conversion failed - no file uploaded', { requestId });
      return res.status(400).json({ error: 'PDF dosyası yüklenmedi.' });
    }

    const dataBuffer = await fs.readFile(req.file.path);
    const data = await pdf(dataBuffer);

    // Convert PDF text to structured data
    const rows = data.text.split('\n').map(line => {
      return line.split(/\s+/).filter(Boolean);
    });

    // Export to Excel
    const exportResult = await exportService.exportToExcel(rows, {
      filename: `pdf-conversion-${req.file.originalname}`,
      headers: ['Column 1', 'Column 2', 'Column 3', 'Column 4', 'Column 5'],
      styles: {
        header: {
          font: { bold: true, color: { argb: 'FF000000' } },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCCCCC' } },
          alignment: { vertical: 'middle', horizontal: 'center' }
        },
        data: {
          font: { color: { argb: 'FF000000' } },
          alignment: { vertical: 'middle', horizontal: 'left' }
        }
      }
    });

    // Clean up the uploaded file
    await fs.unlink(req.file.path);

    logger.info('PDF to Excel conversion completed', {
      requestId,
      filename: req.file.originalname,
      rowCount: rows.length,
      duration: Date.now() - startTime
    });

    res.json({
      success: true,
      exportUrl: exportResult.url
    });
  } catch (error) {
    logger.error('PDF to Excel conversion failed', {
      requestId,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    });
    res.status(500).json({ error: 'PDF Excel dönüşümü sırasında bir hata oluştu.' });
  }
});

// PDF merge endpoint with enhanced features
router.post('/merge', verifyToken, upload.array('pdfs', 5), async (req, res) => {
  const requestId = req.id;
  const startTime = Date.now();
  const { pageOrder, addPageNumbers, addWatermark } = req.body;

  try {
    if (!req.files || req.files.length < 2) {
      logger.warn('PDF merge failed - insufficient files', { requestId });
      return res.status(400).json({ error: 'En az 2 PDF dosyası yüklenmelidir.' });
    }

    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();
    
    // Process each PDF file
    const processedFiles = [];
    for (const file of req.files) {
      try {
        const pdfBytes = await fs.readFile(file.path);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        
        // Preserve metadata
        const metadata = pdfDoc.getInfo();
        if (metadata) {
          mergedPdf.setTitle(metadata.Title || 'Merged Document');
          mergedPdf.setAuthor(metadata.Author || 'MechBuild Editor');
          mergedPdf.setSubject(metadata.Subject || 'Merged PDF Document');
          mergedPdf.setKeywords(metadata.Keywords || ['merged', 'pdf']);
          mergedPdf.setProducer(metadata.Producer || 'MechBuild Editor');
          mergedPdf.setCreator(metadata.Creator || 'MechBuild Editor');
        }

        // Copy all pages from the current PDF to the merged PDF
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        pages.forEach(page => {
          if (addPageNumbers) {
            const { width, height } = page.getSize();
            page.drawText(`Page ${mergedPdf.getPageCount() + 1}`, {
              x: width - 50,
              y: 20,
              size: 10,
              color: rgb(0.5, 0.5, 0.5),
            });
          }
          if (addWatermark) {
            const { width, height } = page.getSize();
            page.drawText('MechBuild Editor', {
              x: width / 2 - 50,
              y: height / 2,
              size: 20,
              color: rgb(0.8, 0.8, 0.8),
              rotate: Math.PI / 4,
              opacity: 0.2,
            });
          }
          mergedPdf.addPage(page);
        });
        
        processedFiles.push({
          filename: file.originalname,
          pageCount: pdfDoc.getPageCount(),
          size: pdfBytes.length
        });

        // Clean up the temporary file
        await fs.unlink(file.path);
      } catch (error) {
        logger.error('Error processing PDF file', {
          requestId,
          filename: file.originalname,
          error: error.message
        });
        throw new Error(`PDF dosyası işlenirken hata oluştu: ${file.originalname}`);
      }
    }

    // Reorder pages if specified
    if (pageOrder && Array.isArray(pageOrder)) {
      const pages = mergedPdf.getPages();
      const reorderedPages = [];
      for (const index of pageOrder) {
        if (index >= 0 && index < pages.length) {
          reorderedPages.push(pages[index]);
        }
      }
      mergedPdf.removePage(0, mergedPdf.getPageCount() - 1);
      reorderedPages.forEach(page => mergedPdf.addPage(page));
    }

    // Save the merged PDF
    const mergedPdfBytes = await mergedPdf.save();
    const outputPath = path.join(__dirname, '../uploads/pdfs', `merged-${Date.now()}.pdf`);
    await fs.writeFile(outputPath, mergedPdfBytes);

    // Export the merged PDF
    const exportResult = await exportService.exportToPDF(mergedPdfBytes, {
      filename: 'merged-document.pdf'
    });

    // Clean up the temporary merged file
    await fs.unlink(outputPath);

    logger.info('PDF merge completed', {
      requestId,
      fileCount: req.files.length,
      totalPages: mergedPdf.getPageCount(),
      duration: Date.now() - startTime
    });

    res.json({
      success: true,
      message: 'PDF dosyaları başarıyla birleştirildi.',
      exportUrl: exportResult.url,
      details: {
        totalPages: mergedPdf.getPageCount(),
        processedFiles,
        options: {
          addPageNumbers,
          addWatermark,
          pageOrder: pageOrder ? 'Custom order applied' : 'Original order maintained'
        }
      }
    });
  } catch (error) {
    logger.error('PDF merge failed', {
      requestId,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    });
    res.status(500).json({ error: 'PDF birleştirme sırasında bir hata oluştu.' });
  }
});

// New endpoint for PDF page extraction
router.post('/extract-pages', verifyToken, upload.single('pdf'), async (req, res) => {
  const requestId = req.id;
  const startTime = Date.now();
  const { pageNumbers } = req.body;

  try {
    if (!req.file) {
      logger.warn('PDF extraction failed - no file uploaded', { requestId });
      return res.status(400).json({ error: 'PDF dosyası yüklenmedi.' });
    }

    if (!pageNumbers || !Array.isArray(pageNumbers) || pageNumbers.length === 0) {
      logger.warn('PDF extraction failed - invalid page numbers', { requestId });
      return res.status(400).json({ error: 'Geçerli sayfa numaraları belirtilmedi.' });
    }

    const pdfBytes = await fs.readFile(req.file.path);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const extractedPdf = await PDFDocument.create();

    // Copy specified pages
    for (const pageNum of pageNumbers) {
      if (pageNum >= 0 && pageNum < pdfDoc.getPageCount()) {
        const [page] = await extractedPdf.copyPages(pdfDoc, [pageNum]);
        extractedPdf.addPage(page);
      }
    }

    const extractedBytes = await extractedPdf.save();
    const outputPath = path.join(__dirname, '../uploads/pdfs', `extracted-${Date.now()}.pdf`);
    await fs.writeFile(outputPath, extractedBytes);

    const exportResult = await exportService.exportToPDF(extractedBytes, {
      filename: 'extracted-pages.pdf'
    });

    await fs.unlink(req.file.path);
    await fs.unlink(outputPath);

    logger.info('PDF extraction completed', {
      requestId,
      filename: req.file.originalname,
      extractedPages: pageNumbers,
      duration: Date.now() - startTime
    });

    res.json({
      success: true,
      message: 'Sayfalar başarıyla çıkarıldı.',
      exportUrl: exportResult.url,
      details: {
        originalPageCount: pdfDoc.getPageCount(),
        extractedPages: pageNumbers,
        extractedPageCount: extractedPdf.getPageCount()
      }
    });
  } catch (error) {
    logger.error('PDF extraction failed', {
      requestId,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    });
    res.status(500).json({ error: 'Sayfa çıkarma işlemi sırasında bir hata oluştu.' });
  }
});

// PDF compression endpoint
router.post('/compress', verifyToken, upload.single('pdf'), async (req, res) => {
  const requestId = req.id;
  const startTime = Date.now();
  const { quality = 'medium' } = req.body;

  try {
    if (!req.file) {
      logger.warn('PDF compression failed - no file uploaded', { requestId });
      return res.status(400).json({ error: 'PDF dosyası yüklenmedi.' });
    }

    const pdfBytes = await fs.readFile(req.file.path);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Apply compression based on quality setting
    const compressionOptions = {
      high: { images: 0.8, text: 0.9 },
      medium: { images: 0.6, text: 0.8 },
      low: { images: 0.4, text: 0.7 }
    };

    const options = compressionOptions[quality] || compressionOptions.medium;
    
    // Compress images
    const pages = pdfDoc.getPages();
    for (const page of pages) {
      const images = await page.getImages();
      for (const image of images) {
        const imageBytes = await image.getImageBytes();
        const compressedBytes = await compressImage(imageBytes, options.images);
        await image.setImageBytes(compressedBytes);
      }
    }

    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false
    });

    const outputPath = path.join(__dirname, '../uploads/pdfs', `compressed-${Date.now()}.pdf`);
    await fs.writeFile(outputPath, compressedBytes);

    const exportResult = await exportService.exportToPDF(compressedBytes, {
      filename: 'compressed-document.pdf'
    });

    await fs.unlink(req.file.path);
    await fs.unlink(outputPath);

    const originalSize = pdfBytes.length;
    const compressedSize = compressedBytes.length;
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);

    logger.info('PDF compression completed', {
      requestId,
      filename: req.file.originalname,
      originalSize,
      compressedSize,
      compressionRatio,
      duration: Date.now() - startTime
    });

    res.json({
      success: true,
      message: 'PDF başarıyla sıkıştırıldı.',
      exportUrl: exportResult.url,
      details: {
        originalSize,
        compressedSize,
        compressionRatio: `${compressionRatio}%`,
        quality
      }
    });
  } catch (error) {
    logger.error('PDF compression failed', {
      requestId,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    });
    res.status(500).json({ error: 'PDF sıkıştırma sırasında bir hata oluştu.' });
  }
});

// PDF protection endpoint
router.post('/protect', verifyToken, upload.single('pdf'), async (req, res) => {
  const requestId = req.id;
  const startTime = Date.now();
  const { password, permissions = {} } = req.body;

  try {
    if (!req.file) {
      logger.warn('PDF protection failed - no file uploaded', { requestId });
      return res.status(400).json({ error: 'PDF dosyası yüklenmedi.' });
    }

    if (!password) {
      logger.warn('PDF protection failed - no password provided', { requestId });
      return res.status(400).json({ error: 'Şifre belirtilmedi.' });
    }

    const pdfBytes = await fs.readFile(req.file.path);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Set document permissions
    pdfDoc.setEncryption({
      userPassword: password,
      ownerPassword: password,
      permissions: {
        printing: permissions.printing ?? 'lowResolution',
        modifying: permissions.modifying ?? false,
        copying: permissions.copying ?? false,
        annotating: permissions.annotating ?? false,
        fillingForms: permissions.fillingForms ?? false,
        contentAccessibility: permissions.contentAccessibility ?? false,
        documentAssembly: permissions.documentAssembly ?? false
      }
    });

    const protectedBytes = await pdfDoc.save();
    const outputPath = path.join(__dirname, '../uploads/pdfs', `protected-${Date.now()}.pdf`);
    await fs.writeFile(outputPath, protectedBytes);

    const exportResult = await exportService.exportToPDF(protectedBytes, {
      filename: 'protected-document.pdf'
    });

    await fs.unlink(req.file.path);
    await fs.unlink(outputPath);

    logger.info('PDF protection completed', {
      requestId,
      filename: req.file.originalname,
      duration: Date.now() - startTime
    });

    res.json({
      success: true,
      message: 'PDF başarıyla korumaya alındı.',
      exportUrl: exportResult.url,
      details: {
        permissions
      }
    });
  } catch (error) {
    logger.error('PDF protection failed', {
      requestId,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    });
    res.status(500).json({ error: 'PDF koruma sırasında bir hata oluştu.' });
  }
});

// Helper functions
async function compressImage(imageBytes, quality) {
  try {
    // Use sharp for image compression
    const sharp = require('sharp');
    const compressedBuffer = await sharp(imageBytes)
      .jpeg({ quality: Math.floor(quality * 100) })
      .toBuffer();
    return compressedBuffer;
  } catch (error) {
    logger.error('Image compression failed', { error: error.message });
    return imageBytes; // Return original if compression fails
  }
}

async function applyCompression(pdfDoc, options) {
  const { quality = 'medium' } = options;
  const compressionOptions = {
    high: { images: 0.8, text: 0.9 },
    medium: { images: 0.6, text: 0.8 },
    low: { images: 0.4, text: 0.7 }
  };

  const settings = compressionOptions[quality] || compressionOptions.medium;
  
  // Compress images in all pages
  const pages = pdfDoc.getPages();
  for (const page of pages) {
    const images = await page.getImages();
    for (const image of images) {
      const imageBytes = await image.getImageBytes();
      const compressedBytes = await compressImage(imageBytes, settings.images);
      await image.setImageBytes(compressedBytes);
    }
  }

  return pdfDoc;
}

async function applyProtection(pdfDoc, options) {
  const { password, permissions = {} } = options;

  if (!password) {
    throw new Error('Password is required for protection');
  }

  pdfDoc.setEncryption({
    userPassword: password,
    ownerPassword: password,
    permissions: {
      printing: permissions.printing ?? 'lowResolution',
      modifying: permissions.modifying ?? false,
      copying: permissions.copying ?? false,
      annotating: permissions.annotating ?? false,
      fillingForms: permissions.fillingForms ?? false,
      contentAccessibility: permissions.contentAccessibility ?? false,
      documentAssembly: permissions.documentAssembly ?? false
    }
  });

  return pdfDoc;
}

// Enhanced watermark function with more styles
async function applyWatermark(pdfDoc, options) {
  const {
    text = 'Confidential',
    fontSize = 20,
    opacity = 0.2,
    color = 'gray',
    position = 'center',
    rotation = 45,
    repeat = false,
    spacing = 100,
    style = 'text', // text, diagonal, border, corner
    borderWidth = 2,
    cornerSize = 50
  } = options;
  
  // Load the standard font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Process each page
  const pages = pdfDoc.getPages();
  for (const page of pages) {
    const { width, height } = page.getSize();
    
    switch (style) {
      case 'text':
        applyTextWatermark(page, { text, fontSize, opacity, color, position, rotation, repeat, spacing, font, width, height });
        break;
      case 'diagonal':
        applyDiagonalWatermark(page, { text, fontSize, opacity, color, font, width, height });
        break;
      case 'border':
        applyBorderWatermark(page, { text, fontSize, opacity, color, borderWidth, font, width, height });
        break;
      case 'corner':
        applyCornerWatermark(page, { text, fontSize, opacity, color, cornerSize, font, width, height });
        break;
    }
  }

  return pdfDoc;
}

// Helper functions for different watermark styles
function applyTextWatermark(page, options) {
  const { text, fontSize, opacity, color, position, rotation, repeat, spacing, font, width, height } = options;
  const textWidth = font.widthOfTextAtSize(text, fontSize);

  if (repeat) {
    const rows = Math.ceil(height / spacing);
    const cols = Math.ceil(width / spacing);
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * spacing;
        const y = row * spacing;
        
        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font: font,
          color: color === 'gray' ? rgb(0.5, 0.5, 0.5) : rgb(0, 0, 0),
          rotate: (rotation * Math.PI) / 180,
          opacity: opacity
        });
      }
    }
  } else {
    let x, y;
    switch (position) {
      case 'top-left': x = 50; y = height - 50; break;
      case 'top-right': x = width - textWidth - 50; y = height - 50; break;
      case 'bottom-left': x = 50; y = 50; break;
      case 'bottom-right': x = width - textWidth - 50; y = 50; break;
      default: x = (width - textWidth) / 2; y = height / 2;
    }
    
    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font: font,
      color: color === 'gray' ? rgb(0.5, 0.5, 0.5) : rgb(0, 0, 0),
      rotate: (rotation * Math.PI) / 180,
      opacity: opacity
    });
  }
}

function applyDiagonalWatermark(page, options) {
  const { text, fontSize, opacity, color, font, width, height } = options;
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  const spacing = textWidth * 1.5;
  
  // Draw diagonal watermarks across the page
  for (let y = -height; y < height * 2; y += spacing) {
    page.drawText(text, {
      x: 0,
      y,
      size: fontSize,
      font: font,
      color: color === 'gray' ? rgb(0.5, 0.5, 0.5) : rgb(0, 0, 0),
      rotate: Math.PI / 4,
      opacity: opacity
    });
  }
}

function applyBorderWatermark(page, options) {
  const { text, fontSize, opacity, color, borderWidth, font, width, height } = options;
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  const spacing = textWidth * 1.2;
  
  // Draw watermarks along the borders
  for (let x = 0; x < width; x += spacing) {
    // Top border
    page.drawText(text, {
      x,
      y: height - borderWidth,
      size: fontSize,
      font: font,
      color: color === 'gray' ? rgb(0.5, 0.5, 0.5) : rgb(0, 0, 0),
      opacity: opacity
    });
    
    // Bottom border
    page.drawText(text, {
      x,
      y: borderWidth,
      size: fontSize,
      font: font,
      color: color === 'gray' ? rgb(0.5, 0.5, 0.5) : rgb(0, 0, 0),
      opacity: opacity
    });
  }
}

function applyCornerWatermark(page, options) {
  const { text, fontSize, opacity, color, cornerSize, font, width, height } = options;
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  
  // Draw watermarks in corners
  const corners = [
    { x: cornerSize, y: height - cornerSize },
    { x: width - cornerSize - textWidth, y: height - cornerSize },
    { x: cornerSize, y: cornerSize },
    { x: width - cornerSize - textWidth, y: cornerSize }
  ];
  
  corners.forEach(({ x, y }) => {
    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font: font,
      color: color === 'gray' ? rgb(0.5, 0.5, 0.5) : rgb(0, 0, 0),
      opacity: opacity
    });
  });
}

// Enhanced OCR processing
async function processOCR(imageBytes, language, requestId) {
  try {
    const { data: { text, confidence } } = await Tesseract.recognize(
      imageBytes,
      language,
      {
        logger: m => logger.info('OCR Progress:', { requestId, message: m }),
        tessjs_create_pdf: '1',
        tessjs_create_hocr: '1',
        preserve_interword_spaces: '1'
      }
    );
    
    return {
      text,
      confidence,
      language
    };
  } catch (error) {
    logger.error('OCR processing failed', {
      requestId,
      error: error.message,
      language
    });
    throw error;
  }
}

// Update batch processing with progress tracking
router.post('/batch', verifyToken, upload.array('pdfs', 10), async (req, res) => {
  const requestId = req.id;
  const startTime = Date.now();
  const { operations = [], progressCallback } = req.body;

  try {
    if (!req.files || req.files.length === 0) {
      logger.warn('Batch processing failed - no files uploaded', { requestId });
      return res.status(400).json({ error: 'PDF dosyaları yüklenmedi.' });
    }

    if (!operations || operations.length === 0) {
      logger.warn('Batch processing failed - no operations specified', { requestId });
      return res.status(400).json({ error: 'İşlem belirtilmedi.' });
    }

    const results = [];
    const totalFiles = req.files.length;
    const totalOperations = operations.length;

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const fileResult = {
        filename: file.originalname,
        operations: [],
        progress: 0
      };

      let pdfBytes = await fs.readFile(file.path);
      let currentDoc = await PDFDocument.load(pdfBytes);

      for (let j = 0; j < operations.length; j++) {
        const operation = operations[j];
        try {
          const operationStartTime = Date.now();
          
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
            case 'extract-text':
              const textResult = await extractTextFromPdf(currentDoc, operation.options);
              fileResult.extractedText = textResult;
              break;
          }

          const operationDuration = Date.now() - operationStartTime;
          fileResult.operations.push({
            type: operation.type,
            success: true,
            duration: operationDuration
          });

          // Update progress
          fileResult.progress = ((j + 1) / totalOperations) * 100;
          if (progressCallback) {
            // Implement progress callback mechanism
            // This could be through WebSocket, SSE, or other real-time communication
          }
        } catch (error) {
          fileResult.operations.push({
            type: operation.type,
            success: false,
            error: error.message,
            duration: Date.now() - operationStartTime
          });
        }
      }

      const outputPath = path.join(__dirname, '../uploads/pdfs', `batch-${Date.now()}-${file.originalname}`);
      pdfBytes = await currentDoc.save();
      await fs.writeFile(outputPath, pdfBytes);

      const exportResult = await exportService.exportToPDF(pdfBytes, {
        filename: `processed-${file.originalname}`
      });

      await fs.unlink(file.path);
      await fs.unlink(outputPath);

      fileResult.exportUrl = exportResult.url;
      fileResult.progress = 100;
      results.push(fileResult);
    }

    logger.info('Batch processing completed', {
      requestId,
      fileCount: totalFiles,
      operationCount: totalOperations,
      duration: Date.now() - startTime
    });

    res.json({
      success: true,
      message: 'Toplu işlem tamamlandı.',
      results,
      summary: {
        totalFiles,
        totalOperations,
        totalDuration: Date.now() - startTime,
        successRate: results.filter(r => r.operations.every(o => o.success)).length / totalFiles
      }
    });
  } catch (error) {
    logger.error('Batch processing failed', {
      requestId,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    });
    res.status(500).json({ error: 'Toplu işlem sırasında bir hata oluştu.' });
  }
});

// Helper function for text extraction
async function extractTextFromPdf(pdfDoc, options) {
  const { useOCR = false, language = 'eng' } = options;
  let extractedText = '';

  if (useOCR) {
    const pages = pdfDoc.getPages();
    for (const page of pages) {
      const images = await page.getImages();
      for (const image of images) {
        const imageBytes = await image.getImageBytes();
        const { data: { text } } = await Tesseract.recognize(
          imageBytes,
          language,
          { logger: m => logger.info('OCR Progress:', { message: m }) }
        );
        extractedText += text + '\n';
      }
    }
  } else {
    // Use pdf-parse for text extraction
    const pdfBytes = await pdfDoc.save();
    const data = await pdf(pdfBytes);
    extractedText = data.text;
  }

  return extractedText;
}

module.exports = router; 