const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { PDFDocument } = require('pdf-lib');
const XLSX = require('xlsx');
const mammoth = require('mammoth');
const sharp = require('sharp');
const { verifyToken } = require('../middleware/auth');
const { AppError } = require('../middleware/error');
const File = require('../models/File');
const Module = require('../models/Module');
const ExcelJS = require('exceljs');

// Multer yapılandırması
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Geçersiz dosya tipi', 400));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Tüm rotalar için auth middleware
router.use(verifyToken);

// Dosya yükleme
router.post('/:moduleId', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Dosya yüklenemedi', 400));
    }

    const module = await Module.findById(req.params.moduleId);
    if (!module) {
      return next(new AppError('Modül bulunamadı', 404));
    }

    const file = new File({
      name: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      type: req.file.mimetype,
      size: req.file.size,
      module: module._id,
      uploadedBy: req.user.id
    });

    await file.save();

    // Modüle dosya referansını ekle
    await module.addFile({
      name: file.name,
      path: file.path,
      type: file.type,
      size: file.size
    }, req.user.id);

    res.status(201).json({
      status: 'success',
      data: {
        file
      }
    });
  } catch (error) {
    next(error);
  }
});

// Modül dosyalarını listele
router.get('/:moduleId', async (req, res, next) => {
  try {
    const module = await Module.findById(req.params.moduleId);
    if (!module) {
      return next(new AppError('Modül bulunamadı', 404));
    }

    const files = await File.find({
      module: module._id,
      status: 'active'
    }).populate('uploadedBy', 'username');

    res.json({
      status: 'success',
      data: {
        files
      }
    });
  } catch (error) {
    next(error);
  }
});

// Dosya indir
router.get('/download/:fileId', async (req, res, next) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) {
      return next(new AppError('Dosya bulunamadı', 404));
    }

    // Dosya kontrolü
    try {
      await fs.access(file.path);
    } catch (error) {
      return next(new AppError('Dosya bulunamadı', 404));
    }

    res.download(file.path, file.originalName);
  } catch (error) {
    next(error);
  }
});

// Dosya sil
router.delete('/:fileId', async (req, res, next) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) {
      return next(new AppError('Dosya bulunamadı', 404));
    }

    // Dosyayı fiziksel olarak sil
    try {
      await fs.unlink(file.path);
    } catch (error) {
      console.error('Dosya silinirken hata:', error);
    }

    // Dosyayı arşivle
    await file.updateStatus('archived');

    res.json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
});

// Dosya metadata güncelle
router.put('/:fileId/metadata', async (req, res, next) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) {
      return next(new AppError('Dosya bulunamadı', 404));
    }

    await file.updateMetadata(req.body);

    res.json({
      status: 'success',
      data: {
        file
      }
    });
  } catch (error) {
    next(error);
  }
});

// Dosya versiyonlarını listele
router.get('/:fileId/versions', async (req, res, next) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) {
      return next(new AppError('Dosya bulunamadı', 404));
    }

    res.json({
      status: 'success',
      data: {
        currentVersion: {
          version: file.version,
          path: file.path,
          modifiedAt: file.lastModified,
          modifiedBy: file.uploadedBy
        },
        previousVersions: file.previousVersions
      }
    });
  } catch (error) {
    next(error);
  }
});

// Dosya analizi
router.post('/:fileId/analyze', async (req, res, next) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) {
      return next(new AppError('Dosya bulunamadı', 404));
    }

    let analysis = {};

    // PDF analizi
    if (file.type === 'application/pdf') {
      analysis = await analyzePDF(file.path);
    }
    // Excel analizi
    else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
             file.type === 'application/vnd.ms-excel') {
      analysis = await analyzeExcel(file.path);
    }
    // Word analizi
    else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
             file.type === 'application/msword') {
      analysis = await analyzeWord(file.path);
    }
    else {
      return next(new AppError('Desteklenmeyen dosya tipi', 400));
    }

    // Metadata'yı güncelle
    await file.updateMetadata(analysis);

    res.json({
      status: 'success',
      data: {
        analysis
      }
    });
  } catch (error) {
    next(error);
  }
});

// Ortak içerik analizi fonksiyonu
async function analyzeContent(textContent, count, type) {
  const keywords = ['yangın', 'HVAC', 'mekanik', 'elektrik', 'tesisat'];
  const keywordsFound = {};
  
  keywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    const matches = textContent.match(regex);
    keywordsFound[keyword] = {
      found: textContent.toLowerCase().includes(keyword.toLowerCase()),
      count: matches ? matches.length : 0
    };
  });

  return {
    type,
    count,
    textLength: textContent.length,
    keywordsFound,
    analysis: {
      totalKeywords: Object.values(keywordsFound).filter(k => k.found).length,
      mostFrequentKeyword: Object.entries(keywordsFound)
        .reduce((a, b) => a[1].count > b[1].count ? a : b)[0],
      keywordDensity: Object.entries(keywordsFound)
        .reduce((acc, [key, value]) => {
          acc[key] = value.count / textContent.length * 100;
          return acc;
        }, {})
    }
  };
}

// PDF analizi fonksiyonu
async function analyzePDF(filePath) {
  const pdfBytes = await fs.readFile(filePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  
  const pageCount = pdfDoc.getPageCount();
  
  let textContent = '';
  const pageLayouts = [];
  const headings = [];
  
  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.getPage(i);
    const text = await page.getText();
    textContent += text;

    // Sayfa düzeni analizi
    const layout = {
      pageNumber: i + 1,
      dimensions: {
        width: page.getWidth(),
        height: page.getHeight()
      },
      textBlocks: [],
      images: [],
      hasLogo: false
    };

    // Metin bloklarını analiz et
    const lines = text.split('\n');
    let currentBlock = {
      text: '',
      lines: 0,
      isHeading: false
    };

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        if (isHeading(trimmedLine)) {
          // Önceki bloğu kaydet
          if (currentBlock.text) {
            layout.textBlocks.push(currentBlock);
          }
          // Yeni başlık bloğu başlat
          currentBlock = {
            text: trimmedLine,
            lines: 1,
            isHeading: true,
            level: getHeadingLevel(trimmedLine)
          };
          headings.push({
            page: i + 1,
            text: trimmedLine,
            level: currentBlock.level
          });
        } else {
          // Normal metin bloğu
          if (currentBlock.isHeading) {
            layout.textBlocks.push(currentBlock);
            currentBlock = {
              text: trimmedLine,
              lines: 1,
              isHeading: false
            };
          } else {
            currentBlock.text += (currentBlock.text ? '\n' : '') + trimmedLine;
            currentBlock.lines++;
          }
        }
      }
    });

    // Son bloğu kaydet
    if (currentBlock.text) {
      layout.textBlocks.push(currentBlock);
    }

    // Logo kontrolü
    const images = await page.getImages();
    for (const image of images) {
      const imageBytes = await pdfDoc.embedImage(image);
      const imageBuffer = await imageBytes.save();
      
      // Logo analizi
      const isLogo = await analyzeImageForLogo(imageBuffer);
      if (isLogo) {
        layout.hasLogo = true;
      }
      
      layout.images.push({
        width: image.width,
        height: image.height,
        isLogo,
        position: {
          x: image.x,
          y: image.y
        }
      });
    }

    pageLayouts.push(layout);
  }

  const baseAnalysis = await analyzeContent(textContent, pageCount, 'PDF');
  
  return {
    ...baseAnalysis,
    pdfSpecific: {
      pageLayouts,
      headings,
      hasLogo: pageLayouts.some(layout => layout.hasLogo),
      totalImages: pageLayouts.reduce((sum, layout) => sum + layout.images.length, 0),
      layoutAnalysis: {
        averageTextDensity: calculateTextDensity(pageLayouts),
        mostCommonLayout: findMostCommonLayout(pageLayouts),
        headingStructure: analyzeHeadingStructure(headings),
        textBlockAnalysis: {
          totalBlocks: pageLayouts.reduce((sum, layout) => sum + layout.textBlocks.length, 0),
          averageBlockSize: calculateAverageBlockSize(pageLayouts),
          headingRatio: calculateHeadingRatio(pageLayouts)
        }
      }
    }
  };
}

// Excel analizi fonksiyonu
async function analyzeExcel(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  const worksheetAnalyses = [];
  let totalCells = 0;
  let totalFormulas = 0;
  let hasCharts = false;
  let hasPivotTables = false;
  
  // Tüm sayfaları analiz et
  workbook.eachSheet((worksheet, sheetId) => {
    const sheetData = [];
    const formulas = [];
    const styles = new Set();
    let formulaCount = 0;
    let cellCount = 0;
    
    // Hücreleri analiz et
    worksheet.eachRow((row, rowNumber) => {
      const rowData = [];
      row.eachCell((cell, colNumber) => {
        cellCount++;
        totalCells++;
        
        // Hücre değeri ve tipini kaydet
        rowData.push({
          value: cell.value,
          type: cell.type,
          address: cell.address
        });
        
        // Formül kontrolü
        if (cell.formula) {
          formulaCount++;
          totalFormulas++;
          formulas.push({
            address: cell.address,
            formula: cell.formula
          });
        }
        
        // Stil analizi
        if (cell.style) {
          const styleKey = JSON.stringify({
            font: cell.style.font,
            fill: cell.style.fill,
            border: cell.style.border,
            alignment: cell.style.alignment
          });
          styles.add(styleKey);
        }
      });
      sheetData.push(rowData);
    });
    
    // Grafik ve pivot tablo kontrolü
    if (worksheet.drawings && worksheet.drawings.length > 0) {
      hasCharts = true;
    }
    
    if (worksheet._pivotTables && worksheet._pivotTables.length > 0) {
      hasPivotTables = true;
    }
    
    worksheetAnalyses.push({
      name: worksheet.name,
      id: sheetId,
      rowCount: worksheet.rowCount,
      columnCount: worksheet.columnCount,
      cellCount,
      formulaCount,
      uniqueStyleCount: styles.size,
      data: sheetData,
      formulas,
      hasCharts: worksheet.drawings && worksheet.drawings.length > 0,
      hasPivotTables: worksheet._pivotTables && worksheet._pivotTables.length > 0
    });
  });
  
  // Metin içeriğini oluştur
  const textContent = worksheetAnalyses
    .map(sheet => sheet.data
      .map(row => row
        .map(cell => cell.value?.toString() || '')
        .join(' '))
      .join('\n'))
    .join('\n\n');
  
  const baseAnalysis = await analyzeContent(textContent, worksheetAnalyses.length, 'Excel');
  
  return {
    ...baseAnalysis,
    excelSpecific: {
      sheetCount: worksheetAnalyses.length,
      totalCells,
      totalFormulas,
      hasCharts,
      hasPivotTables,
      sheets: worksheetAnalyses,
      complexity: calculateExcelComplexity(worksheetAnalyses),
      layoutAnalysis: {
        averageColumnWidth: calculateAverageColumnWidth(worksheetAnalyses),
        dataDensity: totalCells / worksheetAnalyses.reduce((sum, sheet) => sum + (sheet.rowCount * sheet.columnCount), 0),
        formulaDensity: totalFormulas / totalCells,
        styleVariety: worksheetAnalyses.reduce((sum, sheet) => sum + sheet.uniqueStyleCount, 0) / worksheetAnalyses.length
      }
    }
  };
}

// Excel karmaşıklık skorunu hesapla
function calculateExcelComplexity(sheets) {
  const factors = {
    formulaWeight: 2,
    chartWeight: 3,
    pivotTableWeight: 4,
    styleWeight: 1
  };
  
  return sheets.reduce((totalScore, sheet) => {
    const sheetScore = 
      (sheet.formulaCount * factors.formulaWeight) +
      (sheet.hasCharts ? sheet.cellCount * factors.chartWeight / 100 : 0) +
      (sheet.hasPivotTables ? sheet.cellCount * factors.pivotTableWeight / 100 : 0) +
      (sheet.uniqueStyleCount * factors.styleWeight);
    
    return totalScore + sheetScore;
  }, 0);
}

// Hata işleme geliştirmeleri
const excelErrors = {
  'ENOENT': 'Dosya bulunamadı veya erişim izni yok',
  'INVALID_TYPE': 'Geçersiz Excel dosyası formatı',
  'CORRUPT': 'Excel dosyası bozuk veya hasarlı',
  'PASSWORD_PROTECTED': 'Şifre korumalı Excel dosyası',
  'MEMORY_ERROR': 'Dosya işlenirken bellek yetersiz',
  'UNKNOWN': 'Bilinmeyen bir hata oluştu'
};

// Excel dosyası işleme route'u
router.post('/process-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Dosya yüklenmedi',
        code: 'NO_FILE',
        details: 'Lütfen bir Excel dosyası seçin'
      });
    }

    const filePath = req.file.path;
    const { workbook, worksheet, jsonData } = await readExcelFile(filePath);

    // Excel verilerini işle
    const processedData = [];
    let warningMessages = [];
    
    for (let rowIndex = 0; rowIndex < jsonData.length; rowIndex++) {
      const row = jsonData[rowIndex];
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const cellRef = getCellRef(rowIndex, colIndex);
        const cellValue = row[colIndex];
        
        // Hücre değerini işle
        if (cellValue) {
          const cellData = {
            cell: cellRef,
            value: cellValue,
            row: rowIndex + 1,
            column: colIndex + 1
          };
          
          // Hücre doğrulama
          if (typeof cellValue === 'object' && cellValue.error) {
            warningMessages.push({
              cell: cellRef,
              error: 'Hatalı hücre değeri',
              details: cellValue.error
            });
          }
          
          processedData.push(cellData);
        }
      }
    }

    // Sonuçları döndür
    res.json({
      success: true,
      data: processedData,
      metadata: {
        rowCount: jsonData.length,
        columnCount: jsonData[0]?.length || 0,
        totalCells: processedData.length
      },
      warnings: warningMessages.length > 0 ? warningMessages : undefined
    });

  } catch (error) {
    console.error('Excel işleme hatası:', error);
    
    const errorCode = error.code || 'UNKNOWN';
    const errorMessage = excelErrors[errorCode] || excelErrors.UNKNOWN;
    
    res.status(500).json({ 
      error: errorMessage,
      code: errorCode,
      details: error.message
    });
  }
});

// Word analizi fonksiyonu
async function analyzeWord(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  const textContent = result.value;
  
  // Paragraf ve başlık analizi
  const paragraphs = textContent.split('\n\n').filter(p => p.trim().length > 0);
  const paragraphCount = paragraphs.length;
  
  const headings = [];
  const layoutAnalysis = {
    paragraphStyles: [],
    hasLogo: false,
    images: []
  };

  // Başlık ve stil analizi
  paragraphs.forEach((para, index) => {
    if (isHeading(para)) {
      headings.push({
        text: para.trim(),
        level: getHeadingLevel(para),
        position: index + 1
      });
    }
  });

  // Logo ve resim analizi
  if (result.messages) {
    result.messages.forEach(msg => {
      if (msg.type === 'warning' && msg.message.includes('image')) {
        layoutAnalysis.images.push({
          type: 'image',
          description: msg.message
        });
      }
    });
  }

  const baseAnalysis = await analyzeContent(textContent, paragraphCount, 'Word');
  
  return {
    ...baseAnalysis,
    wordSpecific: {
      paragraphCount,
      headings,
      layoutAnalysis: {
        ...layoutAnalysis,
        headingStructure: analyzeHeadingStructure(headings),
        textDensity: calculateWordTextDensity(paragraphs)
      }
    }
  };
}

// Yardımcı fonksiyonlar
function isHeading(text) {
  const headingPatterns = [
    /^[A-Z][a-z]+\s*:/, // Başlık: formatı
    /^[IVX]+\./, // Roma rakamları
    /^\d+\./, // Sayısal başlıklar
    /^[A-Z][A-Z\s]+$/, // Tümü büyük harf
    /^[A-Z][a-z]+\s+[A-Z][a-z]+/ // İki kelimeli başlıklar
  ];
  
  return headingPatterns.some(pattern => pattern.test(text.trim()));
}

function getHeadingLevel(text) {
  if (/^[A-Z][A-Z\s]+$/.test(text.trim())) return 1;
  if (/^[IVX]+\./.test(text.trim())) return 2;
  if (/^\d+\./.test(text.trim())) return 3;
  return 4;
}

async function analyzeImageForLogo(imageBuffer) {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    
    // Logo tespiti için basit kurallar
    const isLogo = 
      metadata.width <= 300 && // Logolar genellikle küçüktür
      metadata.height <= 300 &&
      metadata.width === metadata.height; // Logolar genellikle karedir
    
    return isLogo;
  } catch (error) {
    return false;
  }
}

function calculateTextDensity(pageLayouts) {
  const densities = pageLayouts.map(layout => {
    const area = layout.dimensions.width * layout.dimensions.height;
    return layout.textBlocks.length / area;
  });
  return densities.reduce((a, b) => a + b, 0) / densities.length;
}

function findMostCommonLayout(pageLayouts) {
  const layouts = pageLayouts.map(layout => ({
    width: layout.dimensions.width,
    height: layout.dimensions.height,
    hasLogo: layout.hasLogo,
    imageCount: layout.images.length
  }));
  
  return layouts.reduce((a, b) => 
    layouts.filter(v => JSON.stringify(v) === JSON.stringify(a)).length >=
    layouts.filter(v => JSON.stringify(v) === JSON.stringify(b)).length ? a : b
  );
}

function analyzeHeadingStructure(headings) {
  const levels = {};
  headings.forEach(heading => {
    levels[heading.level] = (levels[heading.level] || 0) + 1;
  });
  
  return {
    totalHeadings: headings.length,
    levelDistribution: levels,
    hasHierarchy: Object.keys(levels).length > 1
  };
}

function calculateAverageColumnWidth(jsonData) {
  const widths = jsonData.map(row => row.length);
  return widths.reduce((a, b) => a + b, 0) / widths.length;
}

function calculateWordTextDensity(paragraphs) {
  const totalLength = paragraphs.reduce((sum, para) => sum + para.length, 0);
  return totalLength / paragraphs.length;
}

// Dosya versiyonunu geri yükle
router.post('/:fileId/restore/:version', async (req, res, next) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) {
      return next(new AppError('Dosya bulunamadı', 404));
    }

    const version = parseInt(req.params.version);
    if (isNaN(version) || version < 1 || version > file.version) {
      return next(new AppError('Geçersiz versiyon numarası', 400));
    }

    if (version === file.version) {
      return next(new AppError('Bu zaten mevcut versiyon', 400));
    }

    // Versiyonu bul
    const targetVersion = file.previousVersions.find(v => v.version === version);
    if (!targetVersion) {
      return next(new AppError('Versiyon bulunamadı', 404));
    }

    // Yeni versiyon oluştur
    await file.addVersion(targetVersion.path, req.user.id);

    res.json({
      status: 'success',
      data: {
        file
      }
    });
  } catch (error) {
    next(error);
  }
});

// Yeni yardımcı fonksiyonlar
function calculateAverageBlockSize(pageLayouts) {
  const blocks = pageLayouts.flatMap(layout => layout.textBlocks);
  const totalLines = blocks.reduce((sum, block) => sum + block.lines, 0);
  return totalLines / blocks.length;
}

function calculateHeadingRatio(pageLayouts) {
  const blocks = pageLayouts.flatMap(layout => layout.textBlocks);
  const headingBlocks = blocks.filter(block => block.isHeading);
  return headingBlocks.length / blocks.length;
}

// Excel dosyası okuma fonksiyonu
async function readExcelFile(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  const worksheet = workbook.getWorksheet(1); // İlk sayfayı al
  const jsonData = [];
  
  worksheet.eachRow((row, rowNumber) => {
    const rowData = [];
    row.eachCell((cell, colNumber) => {
      rowData.push(cell.value);
    });
    jsonData.push(rowData);
  });
  
  return {
    workbook,
    worksheet,
    jsonData
  };
}

// Excel hücre referansı oluşturma fonksiyonu
function getCellRef(rowIndex, colIndex) {
  const column = String.fromCharCode(65 + colIndex); // A, B, C, ...
  return `${column}${rowIndex + 1}`;
}

module.exports = router; 