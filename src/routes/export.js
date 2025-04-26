import express from 'express';
import ExcelJS from 'exceljs';

const router = express.Router();

router.get('/projects', async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Projeler');

  worksheet.columns = [
    { header: 'Proje Adı', key: 'name', width: 30 },
    { header: 'Lokasyon', key: 'location', width: 20 },
    { header: 'Başlangıç Tarihi', key: 'startDate', width: 20 },
    { header: 'Durum', key: 'status', width: 20 }
  ];

  const dummyData = [
    { name: 'Hotel Taşkent', location: 'İstanbul', startDate: '2024-06-01', status: 'Devam Ediyor' },
    { name: 'Ofis Bloğu', location: 'Ankara', startDate: '2024-04-15', status: 'Tamamlandı' }
  ];

  dummyData.forEach(project => worksheet.addRow(project));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=projeler.xlsx');

  await workbook.xlsx.write(res);
  res.end();
});

export default router; 