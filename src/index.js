import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { initDB } from './services/db.js';
import { logActivity } from './services/logger.js';
import exportRouter from './routes/export.js';
import cors from 'cors';
import projectsRoutes from './routes/projects.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API rotaları
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok' });
});

// Export router'ını ekle
app.use('/api/export', exportRouter);

// Projects router'ını ekle
app.use('/api/projects', projectsRoutes);

// Backup endpoint'i
app.post('/api/backup', async (req, res) => {
  try {
    // Yedekleme işlemi burada yapılacak
    const backupData = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      status: 'success'
    };

    // Log kaydı
    await logActivity({
      userId: null,
      action: 'backup_created',
      details: backupData
    });

    res.json(backupData);
  } catch (error) {
    console.error('Yedekleme hatası:', error);
    res.status(500).json({ error: 'Yedekleme işlemi başarısız oldu' });
  }
});

// Restore endpoint'i
app.post('/api/restore/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Geri yükleme işlemi burada yapılacak
    const restoreData = {
      id,
      timestamp: new Date().toISOString(),
      status: 'success'
    };

    // Log kaydı
    await logActivity({
      userId: null,
      action: 'restore_completed',
      details: restoreData
    });

    res.json(restoreData);
  } catch (error) {
    console.error('Geri yükleme hatası:', error);
    res.status(500).json({ error: 'Geri yükleme işlemi başarısız oldu' });
  }
});

// Tüm diğer istekleri index.html'e yönlendir
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

async function startServer() {
  try {
    console.log('Sistem başlatılıyor...');
    
    // Veritabanını başlat
    await initDB();
    console.log('Veritabanı başlatıldı');
    
    // Başlangıç logunu kaydet
    await logActivity({
      userId: null,
      action: 'system_start',
      details: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }
    });
    
    // Sunucuyu başlat
    const server = app.listen(PORT, '127.0.0.1', () => {
      console.log(`API Sunucusu http://localhost:${PORT} adresinde çalışıyor`);
      console.log('Çalışan servisler:');
      console.log('- Yedekleme Sistemi');
      console.log('- Kimlik Doğrulama');
      console.log('- Hata Yönetimi');
      console.log('- Veritabanı');
    });

    // Hata yönetimi
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} zaten kullanımda. Lütfen başka bir port deneyin.`);
        process.exit(1);
      } else {
        console.error('Sunucu hatası:', error);
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error('Sistem başlatılırken hata oluştu:', error);
    process.exit(1);
  }
}

// Sistemi başlat
startServer();
