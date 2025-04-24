// src/services/generateProjectPdf.js

import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export async function generateProjectPdf(projectName, summaryText, aiNotes = []) {
  const safeName = projectName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  const outputPath = `/mnt/data/projects/${safeName}/meta/${safeName}_Rapor.pdf`;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      doc.fontSize(16).text(`📘 Proje Raporu: ${projectName}`, { underline: true });
      doc.moveDown();

      doc.fontSize(12).fillColor("black").text("📊 Özet:");
      doc.moveDown(0.5);
      doc.font("Times-Roman").fontSize(10).text(summaryText, { align: "justify" });
      doc.moveDown();

      if (aiNotes.length > 0) {
        doc.fontSize(12).fillColor("black").text("🤖 AI Açıklamaları:");
        aiNotes.forEach((note, idx) => {
          doc.moveDown(0.5);
          doc.font("Courier").fontSize(9).text(`🔹 ${note}`, { align: "left" });
        });
      }

      doc.end();

      stream.on("finish", () => {
        resolve(outputPath);
      });
    } catch (err) {
      reject("PDF üretim hatası: " + err);
    }
  });
}
