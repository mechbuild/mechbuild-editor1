const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { verifyToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const ExcelJS = require('exceljs');
const cacheService = require('../services/cacheService');
const progressService = require('../services/progressService');
const { fileSecurity, validateFileContent } = require('../middleware/file');
const exportService = require('../services/exportService');
const { AppError } = require('../middleware/error');

const router = express.Router();

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Excel dosyasını okuma fonksiyonu
async function readExcelFile(filePath) {
    const cacheKey = `excel:${path.basename(filePath)}`;
    
    // Önbellekten kontrol et
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
        logger.info('Excel data retrieved from cache', { filePath });
        return cachedData;
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const worksheet = workbook.getWorksheet(1);
    const data = [];
    
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Başlık satırını atla
        
        const rowData = {};
        row.eachCell((cell, colNumber) => {
            const header = worksheet.getRow(1).getCell(colNumber).value;
            rowData[header] = cell.value;
        });
        data.push(rowData);
    });

    // Önbelleğe kaydet
    await cacheService.set(cacheKey, data);
    logger.info('Excel data cached', { filePath });

    return data;
}

async function analyzeExcel(workbook) {
    const analysis = {
        sheets: [],
        totalSheets: workbook.worksheets.length,
        totalCells: 0,
        totalFormulas: 0,
        totalCharts: 0,
        totalPivotTables: 0,
        styles: new Set(),
        formulas: new Set(),
        charts: [],
        pivotTables: [],
        metadata: {
            created: workbook.created,
            modified: workbook.modified,
            creator: workbook.creator,
            lastModifiedBy: workbook.lastModifiedBy,
            company: workbook.company
        }
    };

    workbook.worksheets.forEach(worksheet => {
        const sheetAnalysis = {
            name: worksheet.name,
            rowCount: worksheet.rowCount,
            columnCount: worksheet.columnCount,
            cells: {
                total: 0,
                empty: 0,
                withData: 0,
                withFormulas: 0,
                withStyles: 0
            },
            formulas: [],
            charts: [],
            pivotTables: [],
            styles: new Set(),
            conditionalFormats: [],
            dataValidations: []
        };

        // Hücre analizi
        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell, colNumber) => {
                sheetAnalysis.cells.total++;
                
                if (!cell.value) {
                    sheetAnalysis.cells.empty++;
                } else {
                    sheetAnalysis.cells.withData++;
                }

                if (cell.formula) {
                    sheetAnalysis.cells.withFormulas++;
                    sheetAnalysis.formulas.push({
                        cell: `${getCellRef(rowNumber, colNumber)}`,
                        formula: cell.formula,
                        result: cell.result
                    });
                    analysis.formulas.add(cell.formula);
                }

                if (cell.style) {
                    sheetAnalysis.cells.withStyles++;
                    const styleStr = JSON.stringify(cell.style);
                    sheetAnalysis.styles.add(styleStr);
                    analysis.styles.add(styleStr);
                }
            });
        });

        // Grafik analizi
        worksheet.getImages().forEach(image => {
            if (image.type === 'chart') {
                const chart = {
                    type: image.chartType,
                    title: image.title,
                    position: image.position
                };
                sheetAnalysis.charts.push(chart);
                analysis.charts.push(chart);
            }
        });

        // Pivot tablo analizi
        worksheet.pivotTables.forEach(pivotTable => {
            const pivotAnalysis = {
                name: pivotTable.name,
                range: pivotTable.range,
                fields: pivotTable.fields.map(field => ({
                    name: field.name,
                    type: field.type,
                    subtotal: field.subtotal
                }))
            };
            sheetAnalysis.pivotTables.push(pivotAnalysis);
            analysis.pivotTables.push(pivotAnalysis);
        });

        // Koşullu biçimlendirme analizi
        worksheet.conditionalFormattings.forEach(format => {
            sheetAnalysis.conditionalFormats.push({
                range: format.ranges,
                type: format.type,
                priority: format.priority
            });
        });

        // Veri doğrulama analizi
        worksheet.dataValidations.forEach(validation => {
            sheetAnalysis.dataValidations.push({
                range: validation.ranges,
                type: validation.type,
                operator: validation.operator,
                formula1: validation.formula1,
                formula2: validation.formula2
            });
        });

        analysis.sheets.push(sheetAnalysis);
        analysis.totalCells += sheetAnalysis.cells.total;
        analysis.totalFormulas += sheetAnalysis.cells.withFormulas;
        analysis.totalCharts += sheetAnalysis.charts.length;
        analysis.totalPivotTables += sheetAnalysis.pivotTables.length;
    });

    // Karmaşıklık skoru hesaplama
    analysis.complexityScore = calculateComplexityScore(analysis);

    return analysis;
}

function calculateComplexityScore(analysis) {
    let score = 0;
    
    // Sayfa sayısı etkisi
    score += analysis.totalSheets * 5;
    
    // Hücre sayısı etkisi
    score += Math.log10(analysis.totalCells) * 10;
    
    // Formül sayısı etkisi
    score += analysis.totalFormulas * 2;
    
    // Grafik sayısı etkisi
    score += analysis.totalCharts * 3;
    
    // Pivot tablo sayısı etkisi
    score += analysis.totalPivotTables * 4;
    
    // Stil çeşitliliği etkisi
    score += analysis.styles.size * 1.5;
    
    // Formül çeşitliliği etkisi
    score += analysis.formulas.size * 2;
    
    // Koşullu biçimlendirme etkisi
    analysis.sheets.forEach(sheet => {
        score += sheet.conditionalFormats.length * 2;
        score += sheet.dataValidations.length * 2;
    });

    return Math.min(Math.round(score), 100);
}

// Excel işleme endpoint'i
router.post('/process-excel', verifyToken, upload.single('file'), async (req, res) => {
    const requestId = req.id;
    const startTime = Date.now();
    const operationId = crypto.randomBytes(16).toString('hex');

    try {
        if (!req.file) {
            logger.warn('Excel processing failed - no file uploaded', { requestId });
            return res.status(400).json({ error: 'Excel dosyası yüklenmedi.' });
        }

        // Dosya hash'ini hesapla
        const fileHash = await cacheService.generateCacheKey({
            filename: req.file.originalname,
            size: req.file.size,
            lastModified: req.file.mtime
        });

        // Önbellekten kontrol et
        const cachedAnalysis = await cacheService.get(`excel:${fileHash}`);
        if (cachedAnalysis) {
            logger.info('Excel analysis retrieved from cache', { 
                requestId,
                filename: req.file.originalname
            });

            // İşlem oluştur
            await progressService.createOperation(operationId, 1, {
                filename: req.file.originalname,
                type: 'excel_processing',
                cached: true
            });

            // İşlemi tamamla
            await progressService.completeOperation(operationId, {
                analysis: cachedAnalysis,
                processingTime: Date.now() - startTime
            });

            return res.json({ 
                success: true, 
                operationId,
                analysis: cachedAnalysis,
                metadata: {
                    cached: true,
                    processingTime: Date.now() - startTime
                }
            });
        }

        // İşlem oluştur
        await progressService.createOperation(operationId, 4, {
            filename: req.file.originalname,
            type: 'excel_processing'
        });

        // Dosyayı okuma
        await progressService.updateProgress(operationId, 1, 'Dosya okunuyor...');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(req.file.path);
        
        // Analiz yapma
        await progressService.updateProgress(operationId, 2, 'Dosya analiz ediliyor...');
        const analysis = await analyzeExcel(workbook);
        
        // Önbelleğe kaydet
        await cacheService.set(`excel:${fileHash}`, analysis, 86400); // 24 saat
        
        // Dosyayı temizle
        await progressService.updateProgress(operationId, 3, 'Dosya temizleniyor...');
        await fs.unlink(req.file.path);

        // İşlemi tamamla
        await progressService.updateProgress(operationId, 4, 'İşlem tamamlandı');
        await progressService.completeOperation(operationId, {
            analysis,
            processingTime: Date.now() - startTime
        });

        logger.info('Excel processing completed', {
            requestId,
            complexityScore: analysis.complexityScore,
            duration: Date.now() - startTime
        });

        res.json({ 
            success: true, 
            operationId,
            analysis,
            metadata: {
                complexityScore: analysis.complexityScore,
                processingTime: Date.now() - startTime
            }
        });
    } catch (error) {
        await progressService.failOperation(operationId, error);
        
        logger.error('Excel processing failed', {
            requestId,
            error: error.message,
            stack: error.stack,
            duration: Date.now() - startTime
        });
        res.status(500).json({ 
            error: 'Excel işleme sırasında bir hata oluştu.',
            operationId,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// İşlem durumu endpoint'i
router.get('/operation/:operationId', verifyToken, async (req, res) => {
    try {
        const operation = await progressService.getOperationStatus(req.params.operationId);
        res.json(operation);
    } catch (error) {
        logger.error('Operation status check failed', {
            operationId: req.params.operationId,
            error: error.message
        });
        res.status(404).json({ 
            error: 'İşlem bulunamadı',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// İşlem iptal endpoint'i
router.post('/operation/:operationId/cancel', verifyToken, async (req, res) => {
    try {
        const operation = await progressService.cancelOperation(req.params.operationId);
        res.json(operation);
    } catch (error) {
        logger.error('Operation cancellation failed', {
            operationId: req.params.operationId,
            error: error.message
        });
        res.status(400).json({ 
            error: 'İşlem iptal edilemedi',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Upload a file
router.post('/upload', verifyToken, upload.single('file'), fileSecurity, validateFileContent, async (req, res, next) => {
    try {
        if (!req.file) {
            throw new AppError('Dosya yüklenmedi', 400);
        }

        res.json({
            status: 'success',
            data: {
                filename: req.file.filename,
                path: req.file.path
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get list of files for a project
router.get('/:projectId', verifyToken, async (req, res) => {
    const requestId = crypto.randomBytes(16).toString('hex');
    const startTime = Date.now();

    try {
        const folder = path.join(__dirname, `../uploads/${req.params.projectId}`);
        if (!fs.existsSync(folder)) {
            logger.debug('Project folder not found', {
                requestId,
                projectId: req.params.projectId
            });
            return res.json({ success: true, files: [] });
        }

        const files = await fs.readdir(folder);
        const fileDetails = await Promise.all(files.map(async filename => {
            const filePath = path.join(folder, filename);
            const stats = await fs.stat(filePath);
            return {
                name: filename,
                size: stats.size,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                url: `/api/files/${req.params.projectId}/${filename}`
            };
        }));

        logger.info('File list retrieved', {
            requestId,
            projectId: req.params.projectId,
            fileCount: files.length,
            duration: Date.now() - startTime
        });

        res.json({ 
            success: true, 
            files: fileDetails
        });
    } catch (error) {
        logger.error('File list error', {
            requestId,
            projectId: req.params.projectId,
            error: error.message,
            stack: error.stack,
            duration: Date.now() - startTime
        });

        res.status(500).json({ 
            success: false, 
            error: 'Dosya listesi alınamadı',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Download a file
router.get('/:projectId/:filename', verifyToken, async (req, res) => {
    const requestId = crypto.randomBytes(16).toString('hex');
    const startTime = Date.now();

    try {
        const filePath = path.join(__dirname, '../uploads', req.params.projectId, req.params.filename);
        if (!fs.existsSync(filePath)) {
            logger.warn('File not found', {
                requestId,
                projectId: req.params.projectId,
                filename: req.params.filename
            });
            return res.status(404).json({ 
                success: false, 
                error: 'Dosya bulunamadı' 
            });
        }

        const stats = await fs.stat(filePath);
        logger.info('File download started', {
            requestId,
            projectId: req.params.projectId,
            filename: req.params.filename,
            size: stats.size,
            duration: Date.now() - startTime
        });

        res.download(filePath, (err) => {
            if (err) {
                logger.error('File download error', {
                    requestId,
                    projectId: req.params.projectId,
                    filename: req.params.filename,
                    error: err.message,
                    stack: err.stack,
                    duration: Date.now() - startTime
                });
            } else {
                logger.info('File download completed', {
                    requestId,
                    projectId: req.params.projectId,
                    filename: req.params.filename,
                    duration: Date.now() - startTime
                });
            }
        });
    } catch (error) {
        logger.error('File download error', {
            requestId,
            projectId: req.params.projectId,
            filename: req.params.filename,
            error: error.message,
            stack: error.stack,
            duration: Date.now() - startTime
        });

        res.status(500).json({ 
            success: false, 
            error: 'Dosya indirme hatası',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Toplu Excel işleme endpoint'i
router.post('/process-batch', verifyToken, upload.array('files', 10), async (req, res) => {
    const requestId = req.id;
    const startTime = Date.now();
    const batchId = crypto.randomBytes(16).toString('hex');

    try {
        if (!req.files || req.files.length === 0) {
            logger.warn('Batch processing failed - no files uploaded', { requestId });
            return res.status(400).json({ error: 'Excel dosyaları yüklenmedi.' });
        }

        // Toplu işlem oluştur
        await progressService.createOperation(batchId, req.files.length * 4, {
            type: 'batch_excel_processing',
            fileCount: req.files.length
        });

        const results = [];
        let currentFile = 0;

        for (const file of req.files) {
            try {
                currentFile++;
                const fileOperationId = `${batchId}-${currentFile}`;

                // Dosya okuma
                await progressService.updateProgress(
                    batchId,
                    (currentFile - 1) * 4 + 1,
                    `${file.originalname} dosyası okunuyor...`
                );
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.readFile(file.path);

                // Analiz yapma
                await progressService.updateProgress(
                    batchId,
                    (currentFile - 1) * 4 + 2,
                    `${file.originalname} dosyası analiz ediliyor...`
                );
                const analysis = await analyzeExcel(workbook);

                // Dosyayı temizle
                await progressService.updateProgress(
                    batchId,
                    (currentFile - 1) * 4 + 3,
                    `${file.originalname} dosyası temizleniyor...`
                );
                await fs.unlink(file.path);

                results.push({
                    filename: file.originalname,
                    analysis,
                    status: 'success'
                });

                await progressService.updateProgress(
                    batchId,
                    currentFile * 4,
                    `${file.originalname} dosyası işlendi`
                );
            } catch (error) {
                logger.error('File processing failed in batch', {
                    requestId,
                    filename: file.originalname,
                    error: error.message
                });

                results.push({
                    filename: file.originalname,
                    error: error.message,
                    status: 'failed'
                });

                // Hata durumunda dosyayı temizle
                if (file.path) {
                    await fs.unlink(file.path).catch(() => {});
                }
            }
        }

        // Toplu işlemi tamamla
        await progressService.completeOperation(batchId, {
            results,
            totalFiles: req.files.length,
            successfulFiles: results.filter(r => r.status === 'success').length,
            failedFiles: results.filter(r => r.status === 'failed').length,
            processingTime: Date.now() - startTime
        });

        logger.info('Batch processing completed', {
            requestId,
            totalFiles: req.files.length,
            duration: Date.now() - startTime
        });

        res.json({
            success: true,
            batchId,
            results,
            metadata: {
                totalFiles: req.files.length,
                successfulFiles: results.filter(r => r.status === 'success').length,
                failedFiles: results.filter(r => r.status === 'failed').length,
                processingTime: Date.now() - startTime
            }
        });
    } catch (error) {
        await progressService.failOperation(batchId, error);
        
        logger.error('Batch processing failed', {
            requestId,
            error: error.message,
            stack: error.stack,
            duration: Date.now() - startTime
        });

        // Hata durumunda tüm dosyaları temizle
        if (req.files) {
            await Promise.all(
                req.files.map(file => 
                    fs.unlink(file.path).catch(() => {})
                )
            );
        }

        res.status(500).json({ 
            error: 'Toplu işlem sırasında bir hata oluştu.',
            batchId,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Excel analiz sonuçlarını PDF olarak dışa aktarma endpoint'i
router.get('/export-analysis/:operationId', verifyToken, async (req, res) => {
    const requestId = req.id;
    const startTime = Date.now();

    try {
        const operation = await progressService.getOperationStatus(req.params.operationId);
        
        if (!operation || operation.status !== 'completed') {
            return res.status(404).json({ 
                error: 'İşlem bulunamadı veya henüz tamamlanmadı.' 
            });
        }

        const { analysis } = operation.result;
        const filename = `excel-analysis-${Date.now()}`;
        
        const pdfPath = await exportService.exportAnalysisToPDF(analysis, filename);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);
        
        const fileStream = fs.createReadStream(pdfPath);
        fileStream.pipe(res);

        fileStream.on('end', () => {
            fs.unlink(pdfPath).catch(() => {});
        });

        logger.info('Analysis PDF exported', {
            requestId,
            operationId: req.params.operationId,
            duration: Date.now() - startTime
        });
    } catch (error) {
        logger.error('Analysis PDF export failed', {
            requestId,
            operationId: req.params.operationId,
            error: error.message,
            stack: error.stack,
            duration: Date.now() - startTime
        });

        res.status(500).json({ 
            error: 'PDF dışa aktarma sırasında bir hata oluştu.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 