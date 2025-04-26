import express from 'express';
import { performanceMonitor } from '../utils/performanceMonitor';
import PDFDocument from 'pdfkit';
import { promisify } from 'util';
import { pipeline } from 'stream';

const router = express.Router();
const pipelineAsync = promisify(pipeline);

// Rapor verilerini getir
router.get('/report', async (req, res) => {
  try {
    const { range, type } = req.query;
    const data = await generateReportData(range, type);
    res.json(data);
  } catch (error) {
    console.error('Rapor oluşturma hatası:', error);
    res.status(500).json({ error: 'Rapor oluşturulurken bir hata oluştu' });
  }
});

// PDF raporunu indir
router.get('/report/export', async (req, res) => {
  try {
    const { range, type } = req.query;
    const data = await generateReportData(range, type);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=performans-raporu-${new Date().toISOString()}.pdf`);

    const doc = new PDFDocument();
    doc.pipe(res);

    // Başlık
    doc.fontSize(20).text('Performans Raporu', { align: 'center' });
    doc.moveDown();

    // Rapor bilgileri
    doc.fontSize(12).text(`Rapor Tipi: ${getReportTypeLabel(type)}`);
    doc.text(`Zaman Aralığı: ${getTimeRangeLabel(range)}`);
    doc.text(`Oluşturulma Tarihi: ${new Date().toLocaleString()}`);
    doc.moveDown();

    // Rapor içeriği
    switch (type) {
      case 'summary':
        await generateSummaryReport(doc, data);
        break;
      case 'detailed':
        await generateDetailedReport(doc, data);
        break;
      case 'trends':
        await generateTrendsReport(doc, data);
        break;
      case 'alerts':
        await generateAlertsReport(doc, data);
        break;
    }

    doc.end();
  } catch (error) {
    console.error('PDF oluşturma hatası:', error);
    res.status(500).json({ error: 'PDF oluşturulurken bir hata oluştu' });
  }
});

// Rapor verilerini oluştur
async function generateReportData(range, type) {
  const endTime = new Date();
  let startTime;

  switch (range) {
    case '1h':
      startTime = new Date(endTime - 60 * 60 * 1000);
      break;
    case '6h':
      startTime = new Date(endTime - 6 * 60 * 60 * 1000);
      break;
    case '24h':
      startTime = new Date(endTime - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startTime = new Date(endTime - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startTime = new Date(endTime - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startTime = new Date(endTime - 24 * 60 * 60 * 1000);
  }

  const historicalData = await performanceMonitor.getHistoricalMetrics(startTime, endTime);
  const alerts = await performanceMonitor.getAlerts();
  const recommendations = await performanceMonitor.getRecommendations();

  switch (type) {
    case 'summary':
      return generateSummaryData(historicalData);
    case 'detailed':
      return generateDetailedData(historicalData);
    case 'trends':
      return generateTrendsData(historicalData);
    case 'alerts':
      return generateAlertsData(alerts, recommendations);
    default:
      return generateSummaryData(historicalData);
  }
}

// Özet rapor verilerini oluştur
function generateSummaryData(historicalData) {
  const cpuData = historicalData.map(d => d.system.cpu.usage);
  const memoryData = historicalData.map(d => d.system.memory.usage);
  const responseTimeData = historicalData.map(d => d.application.responseTimes.p95);

  return {
    summary: {
      cpu: {
        average: calculateAverage(cpuData),
        max: Math.max(...cpuData),
        min: Math.min(...cpuData)
      },
      memory: {
        average: calculateAverage(memoryData),
        max: Math.max(...memoryData),
        min: Math.min(...memoryData)
      },
      responseTime: {
        average: calculateAverage(responseTimeData),
        max: Math.max(...responseTimeData),
        min: Math.min(...responseTimeData)
      }
    },
    trends: historicalData.map(d => ({
      timestamp: d.timestamp,
      cpu: d.system.cpu.usage,
      memory: d.system.memory.usage,
      responseTime: d.application.responseTimes.p95
    }))
  };
}

// Detaylı rapor verilerini oluştur
function generateDetailedData(historicalData) {
  return historicalData.map(d => ({
    timestamp: d.timestamp,
    metric: 'CPU',
    value: d.system.cpu.usage,
    threshold: 80
  }));
}

// Trend verilerini oluştur
function generateTrendsData(historicalData) {
  return historicalData.map(d => ({
    timestamp: d.timestamp,
    cpu: d.system.cpu.usage,
    memory: d.system.memory.usage,
    responseTime: d.application.responseTimes.p95
  }));
}

// Uyarı verilerini oluştur
function generateAlertsData(alerts, recommendations) {
  return alerts.map(alert => ({
    ...alert,
    recommendation: recommendations.find(r => r.type === alert.type)?.message || 'Öneri bulunamadı'
  }));
}

// PDF rapor oluşturma fonksiyonları
async function generateSummaryReport(doc, data) {
  doc.fontSize(16).text('Performans Özeti', { align: 'center' });
  doc.moveDown();

  // CPU
  doc.fontSize(14).text('CPU Kullanımı');
  doc.text(`Ortalama: ${data.summary.cpu.average}%`);
  doc.text(`Maksimum: ${data.summary.cpu.max}%`);
  doc.text(`Minimum: ${data.summary.cpu.min}%`);
  doc.moveDown();

  // Bellek
  doc.fontSize(14).text('Bellek Kullanımı');
  doc.text(`Ortalama: ${data.summary.memory.average}%`);
  doc.text(`Maksimum: ${data.summary.memory.max}%`);
  doc.text(`Minimum: ${data.summary.memory.min}%`);
  doc.moveDown();

  // Yanıt Süresi
  doc.fontSize(14).text('Yanıt Süresi');
  doc.text(`Ortalama: ${data.summary.responseTime.average}ms`);
  doc.text(`Maksimum: ${data.summary.responseTime.max}ms`);
  doc.text(`Minimum: ${data.summary.responseTime.min}ms`);
}

async function generateDetailedReport(doc, data) {
  doc.fontSize(16).text('Detaylı Performans Analizi', { align: 'center' });
  doc.moveDown();

  data.forEach(item => {
    doc.fontSize(12).text(`Tarih: ${new Date(item.timestamp).toLocaleString()}`);
    doc.text(`Metrik: ${item.metric}`);
    doc.text(`Değer: ${item.value}`);
    doc.text(`Eşik: ${item.threshold}`);
    doc.moveDown();
  });
}

async function generateTrendsReport(doc, data) {
  doc.fontSize(16).text('Uzun Vadeli Trendler', { align: 'center' });
  doc.moveDown();

  data.forEach(item => {
    doc.fontSize(12).text(`Tarih: ${new Date(item.timestamp).toLocaleString()}`);
    doc.text(`CPU: ${item.cpu}%`);
    doc.text(`Bellek: ${item.memory}%`);
    doc.text(`Yanıt Süresi: ${item.responseTime}ms`);
    doc.moveDown();
  });
}

async function generateAlertsReport(doc, data) {
  doc.fontSize(16).text('Uyarı ve Öneriler', { align: 'center' });
  doc.moveDown();

  data.forEach(item => {
    doc.fontSize(12).text(`Tarih: ${new Date(item.timestamp).toLocaleString()}`);
    doc.text(`Tip: ${item.type}`);
    doc.text(`Mesaj: ${item.message}`);
    doc.text(`Öneri: ${item.recommendation}`);
    doc.moveDown();
  });
}

// Yardımcı fonksiyonlar
function calculateAverage(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function getReportTypeLabel(type) {
  const types = {
    summary: 'Özet Rapor',
    detailed: 'Detaylı Rapor',
    trends: 'Trend Analizi',
    alerts: 'Uyarı Raporu'
  };
  return types[type] || type;
}

function getTimeRangeLabel(range) {
  const ranges = {
    '1h': 'Son 1 Saat',
    '6h': 'Son 6 Saat',
    '24h': 'Son 24 Saat',
    '7d': 'Son 7 Gün',
    '30d': 'Son 30 Gün'
  };
  return ranges[range] || range;
}

export default router; 