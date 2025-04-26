const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const crypto = require('crypto');

class ExportService {
    constructor() {
        this.supportedFormats = {
            excel: ['xlsx', 'xls'],
            pdf: ['pdf'],
            csv: ['csv'],
            json: ['json']
        };
        this.exportsDir = path.join(__dirname, '../../uploads/exports');
        this.ensureExportsDirectory();
    }

    async ensureExportsDirectory() {
        try {
            await fs.mkdir(this.exportsDir, { recursive: true });
        } catch (error) {
            logger.error('Failed to create exports directory', { error });
        }
    }

    async exportToExcel(data, options = {}) {
        const requestId = crypto.randomBytes(16).toString('hex');
        const startTime = Date.now();

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(options.sheetName || 'Sheet1');

            // Başlıkları ayarla
            if (options.headers) {
                worksheet.addRow(options.headers);
            }

            // Verileri ekle
            data.forEach(row => {
                worksheet.addRow(row);
            });

            // Stil ayarları
            if (options.styles) {
                this._applyExcelStyles(worksheet, options.styles);
            }

            // Dosya yolu oluştur
            const filename = `${options.filename || 'export'}_${Date.now()}.xlsx`;
            const filePath = path.join(this.exportsDir, filename);

            // Dizin kontrolü
            await fs.mkdir(path.dirname(filePath), { recursive: true });

            // Dosyayı kaydet
            await workbook.xlsx.writeFile(filePath);

            logger.info('Excel export completed', {
                requestId,
                filename,
                rowCount: data.length,
                duration: Date.now() - startTime
            });

            return {
                success: true,
                filename,
                path: filePath,
                url: `/api/exports/${filename}`
            };
        } catch (error) {
            logger.error('Excel export failed', {
                requestId,
                error: error.message,
                stack: error.stack,
                duration: Date.now() - startTime
            });
            throw error;
        }
    }

    async exportToPDF(data, options = {}) {
        const requestId = crypto.randomBytes(16).toString('hex');
        const startTime = Date.now();

        try {
            const doc = new PDFDocument();
            const filename = `${options.filename || 'export'}_${Date.now()}.pdf`;
            const filePath = path.join(this.exportsDir, filename);

            // Dizin kontrolü
            await fs.mkdir(path.dirname(filePath), { recursive: true });

            // PDF oluştur
            const stream = doc.pipe(require('fs').createWriteStream(filePath));

            // Başlık
            if (options.title) {
                doc.fontSize(20).text(options.title, { align: 'center' });
                doc.moveDown();
            }

            // Tablo başlıkları
            if (options.headers) {
                doc.fontSize(12).text(options.headers.join(' | '));
                doc.moveDown();
            }

            // Verileri ekle
            data.forEach(row => {
                doc.fontSize(10).text(Array.isArray(row) ? row.join(' | ') : JSON.stringify(row));
                doc.moveDown();
            });

            // PDF'yi tamamla
            doc.end();

            // Stream tamamlanmasını bekle
            await new Promise((resolve, reject) => {
                stream.on('finish', resolve);
                stream.on('error', reject);
            });

            logger.info('PDF export completed', {
                requestId,
                filename,
                pageCount: doc.pageCount,
                duration: Date.now() - startTime
            });

            return {
                success: true,
                filename,
                path: filePath,
                url: `/api/exports/${filename}`
            };
        } catch (error) {
            logger.error('PDF export failed', {
                requestId,
                error: error.message,
                stack: error.stack,
                duration: Date.now() - startTime
            });
            throw error;
        }
    }

    async exportToCSV(data, options = {}) {
        const requestId = crypto.randomBytes(16).toString('hex');
        const startTime = Date.now();

        try {
            const filename = `${options.filename || 'export'}_${Date.now()}.csv`;
            const filePath = path.join(this.exportsDir, filename);

            // Dizin kontrolü
            await fs.mkdir(path.dirname(filePath), { recursive: true });

            // CSV içeriğini oluştur
            let csvContent = '';

            // Başlıkları ekle
            if (options.headers) {
                csvContent += options.headers.join(',') + '\n';
            }

            // Verileri ekle
            data.forEach(row => {
                const values = Array.isArray(row) ? row : Object.values(row);
                csvContent += values.map(value => {
                    // Özel karakterleri ve virgülleri escape et
                    if (typeof value === 'string') {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',') + '\n';
            });

            // Dosyayı kaydet
            await fs.writeFile(filePath, csvContent, 'utf8');

            logger.info('CSV export completed', {
                requestId,
                filename,
                rowCount: data.length,
                duration: Date.now() - startTime
            });

            return {
                success: true,
                filename,
                path: filePath,
                url: `/api/exports/${filename}`
            };
        } catch (error) {
            logger.error('CSV export failed', {
                requestId,
                error: error.message,
                stack: error.stack,
                duration: Date.now() - startTime
            });
            throw error;
        }
    }

    async exportToJSON(data, options = {}) {
        const requestId = crypto.randomBytes(16).toString('hex');
        const startTime = Date.now();

        try {
            const filename = `${options.filename || 'export'}_${Date.now()}.json`;
            const filePath = path.join(this.exportsDir, filename);

            // Dizin kontrolü
            await fs.mkdir(path.dirname(filePath), { recursive: true });

            // JSON içeriğini oluştur
            const jsonContent = JSON.stringify(data, null, 2);

            // Dosyayı kaydet
            await fs.writeFile(filePath, jsonContent, 'utf8');

            logger.info('JSON export completed', {
                requestId,
                filename,
                dataSize: jsonContent.length,
                duration: Date.now() - startTime
            });

            return {
                success: true,
                filename,
                path: filePath,
                url: `/api/exports/${filename}`
            };
        } catch (error) {
            logger.error('JSON export failed', {
                requestId,
                error: error.message,
                stack: error.stack,
                duration: Date.now() - startTime
            });
            throw error;
        }
    }

    _applyExcelStyles(worksheet, styles) {
        if (styles.header) {
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true, ...styles.header.font };
            headerRow.fill = styles.header.fill;
            headerRow.alignment = styles.header.alignment;
        }

        if (styles.data) {
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1) { // Skip header
                    row.font = styles.data.font;
                    row.fill = styles.data.fill;
                    row.alignment = styles.data.alignment;
                }
            });
        }

        if (styles.columns) {
            Object.entries(styles.columns).forEach(([col, style]) => {
                const column = worksheet.getColumn(col);
                column.width = style.width;
                column.alignment = style.alignment;
            });
        }
    }

    async exportAnalysisToPDF(analysis, filename) {
        const filePath = path.join(this.exportsDir, `${filename}-analysis.pdf`);
        const doc = new PDFDocument();

        // PDF oluşturma
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Başlık
        doc.fontSize(20).text('Excel Analiz Raporu', { align: 'center' });
        doc.moveDown();

        // Genel Bilgiler
        doc.fontSize(16).text('Genel Bilgiler');
        doc.fontSize(12);
        doc.text(`Toplam Sayfa Sayısı: ${analysis.totalSheets}`);
        doc.text(`Toplam Hücre Sayısı: ${analysis.totalCells.toLocaleString()}`);
        doc.text(`Toplam Formül Sayısı: ${analysis.totalFormulas}`);
        doc.text(`Toplam Grafik Sayısı: ${analysis.totalCharts}`);
        doc.text(`Toplam Pivot Tablo Sayısı: ${analysis.totalPivotTables}`);
        doc.moveDown();

        // Karmaşıklık Skoru
        doc.fontSize(16).text('Karmaşıklık Analizi');
        doc.fontSize(12);
        const complexityColor = analysis.complexityScore > 70 ? 'red' : 
                              analysis.complexityScore > 40 ? 'orange' : 'green';
        doc.fillColor(complexityColor)
           .text(`Karmaşıklık Skoru: ${analysis.complexityScore}/100`);
        doc.fillColor('black');
        doc.moveDown();

        // Sayfa Detayları
        doc.fontSize(16).text('Sayfa Detayları');
        analysis.sheets.forEach((sheet, index) => {
            doc.fontSize(14).text(`Sayfa ${index + 1}: ${sheet.name}`);
            doc.fontSize(12);
            doc.text(`Satır Sayısı: ${sheet.rowCount}`);
            doc.text(`Sütun Sayısı: ${sheet.columnCount}`);
            doc.text(`Dolu Hücre Sayısı: ${sheet.cells.withData}`);
            doc.text(`Formül İçeren Hücre Sayısı: ${sheet.cells.withFormulas}`);
            doc.text(`Stil İçeren Hücre Sayısı: ${sheet.cells.withStyles}`);
            doc.moveDown();
        });

        // Formül Analizi
        if (analysis.formulas.size > 0) {
            doc.fontSize(16).text('Formül Analizi');
            doc.fontSize(12);
            doc.text(`Benzersiz Formül Sayısı: ${analysis.formulas.size}`);
            doc.moveDown();
            doc.text('Kullanılan Formüller:');
            Array.from(analysis.formulas).forEach(formula => {
                doc.text(`- ${formula}`);
            });
            doc.moveDown();
        }

        // Grafik ve Pivot Tablolar
        if (analysis.charts.length > 0 || analysis.pivotTables.length > 0) {
            doc.fontSize(16).text('Grafik ve Pivot Tablolar');
            doc.fontSize(12);
            
            if (analysis.charts.length > 0) {
                doc.text('Grafikler:');
                analysis.charts.forEach(chart => {
                    doc.text(`- ${chart.type}: ${chart.title || 'Başlıksız'}`);
                });
            }

            if (analysis.pivotTables.length > 0) {
                doc.text('Pivot Tablolar:');
                analysis.pivotTables.forEach(pivot => {
                    doc.text(`- ${pivot.name}`);
                    doc.text(`  Alanlar: ${pivot.fields.map(f => f.name).join(', ')}`);
                });
            }
            doc.moveDown();
        }

        // Stil Analizi
        doc.fontSize(16).text('Stil Analizi');
        doc.fontSize(12);
        doc.text(`Benzersiz Stil Sayısı: ${analysis.styles.size}`);
        
        // Koşullu Biçimlendirme
        const totalConditionalFormats = analysis.sheets.reduce(
            (acc, sheet) => acc + sheet.conditionalFormats.length, 0
        );
        if (totalConditionalFormats > 0) {
            doc.text(`Toplam Koşullu Biçimlendirme: ${totalConditionalFormats}`);
        }

        // Veri Doğrulama
        const totalDataValidations = analysis.sheets.reduce(
            (acc, sheet) => acc + sheet.dataValidations.length, 0
        );
        if (totalDataValidations > 0) {
            doc.text(`Toplam Veri Doğrulama: ${totalDataValidations}`);
        }

        // Metadata
        doc.moveDown();
        doc.fontSize(14).text('Dosya Bilgileri');
        doc.fontSize(12);
        if (analysis.metadata) {
            Object.entries(analysis.metadata).forEach(([key, value]) => {
                if (value) doc.text(`${key}: ${value}`);
            });
        }

        // Rapor oluşturma tarihi
        doc.moveDown();
        doc.fontSize(10).text(
            `Rapor Oluşturma Tarihi: ${new Date().toLocaleString('tr-TR')}`,
            { align: 'right' }
        );

        doc.end();

        await new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
        });

        return filePath;
    }

    async cleanupOldExports(maxAgeHours = 24) {
        try {
            const files = await fs.readdir(this.exportsDir);
            const now = Date.now();
            
            for (const file of files) {
                const filePath = path.join(this.exportsDir, file);
                const stats = await fs.stat(filePath);
                const ageHours = (now - stats.mtimeMs) / (1000 * 60 * 60);
                
                if (ageHours > maxAgeHours) {
                    await fs.unlink(filePath);
                    logger.info('Old export file deleted', { filePath });
                }
            }
        } catch (error) {
            logger.error('Failed to cleanup old exports', { error });
        }
    }
}

module.exports = new ExportService(); 