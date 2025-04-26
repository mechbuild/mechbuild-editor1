// src/services/generateProjectPdf.js

import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { AppError, handleError } from './errorHandler';

export async function generateProjectPdf(projectName, summaryText, aiNotes = []) {
  try {
    if (!projectName || !summaryText) {
      throw new AppError('Proje adı ve özet metni gereklidir.', 'error', 400);
    }

    const safeName = projectName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
    const outputDir = `/mnt/data/projects/${safeName}/meta`;
    const outputPath = path.join(outputDir, `${safeName}_Rapor.pdf`);

    // Çıktı dizininin varlığını kontrol et
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `${projectName} Proje Raporu`,
            Author: 'MechBuild Editor',
            Subject: 'Proje Raporu',
            Keywords: 'mekanik, proje, rapor',
            CreationDate: new Date()
          }
        });

        const stream = fs.createWriteStream(outputPath);
        
        // Hata yakalama
        stream.on('error', (err) => {
          reject(new AppError(`PDF yazma hatası: ${err.message}`, 'error', 500));
        });

        doc.pipe(stream);

        // Başlık
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text(`📘 Proje Raporu: ${projectName}`, { align: 'center' })
           .moveDown();

        // Tarih
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, { align: 'right' })
           .moveDown(2);

        // Özet
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('📊 Özet:', { underline: true })
           .moveDown(0.5);

        doc.fontSize(12)
           .font('Helvetica')
           .text(summaryText, { align: 'justify' })
           .moveDown(2);

        // AI Notları
        if (aiNotes.length > 0) {
          doc.fontSize(14)
             .font('Helvetica-Bold')
             .text('🤖 AI Açıklamaları:', { underline: true })
             .moveDown(0.5);

          aiNotes.forEach((note, idx) => {
            doc.fontSize(11)
               .font('Helvetica')
               .text(`🔹 ${note}`, { align: 'left' })
               .moveDown(0.5);
          });
        }

        // Altbilgi
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc.fontSize(8)
             .font('Helvetica')
             .text(
               `Sayfa ${i + 1} / ${pageCount}`,
               doc.page.width - 50,
               doc.page.height - 30,
               { align: 'right' }
             );
        }

        doc.end();

        stream.on('finish', () => {
          resolve(outputPath);
        });
      } catch (err) {
        reject(handleError(err));
      }
    });
  } catch (err) {
    return handleError(err);
  }
}
