import fs from 'fs';
import path from 'path';
import { AppError, handleError } from './errorHandler';

export async function initializeEnvironment() {
  try {
    const baseDirs = {
      projects: '/mnt/data/projects',
      logs: '/mnt/data/logs',
      temp: '/mnt/data/temp',
      backups: '/mnt/data/backups'
    };

    // Ana dizinleri oluştur
    for (const [key, dir] of Object.entries(baseDirs)) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ ${key} dizini oluşturuldu: ${dir}`);
      }
    }

    // Log dizini için günlük log dosyası oluştur
    const logFile = path.join(baseDirs.logs, `${new Date().toISOString().split('T')[0]}.log`);
    if (!fs.existsSync(logFile)) {
      fs.writeFileSync(logFile, `[${new Date().toISOString()}] Sistem başlatıldı\n`);
    }

    // Yedekleme dizini için günlük yedekleme klasörü oluştur
    const backupDir = path.join(baseDirs.backups, new Date().toISOString().split('T')[0]);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    return {
      status: 'success',
      message: 'Ortam başarıyla hazırlandı',
      directories: baseDirs
    };
  } catch (err) {
    return handleError(err);
  }
}

export async function validateEnvironment() {
  try {
    const requiredDirs = ['/mnt/data/projects', '/mnt/data/logs', '/mnt/data/temp', '/mnt/data/backups'];
    const missingDirs = requiredDirs.filter(dir => !fs.existsSync(dir));

    if (missingDirs.length > 0) {
      throw new AppError(`Eksik dizinler: ${missingDirs.join(', ')}`, 'error', 500);
    }

    // Dizin izinlerini kontrol et
    for (const dir of requiredDirs) {
      try {
        const testFile = path.join(dir, '.test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
      } catch (err) {
        throw new AppError(`${dir} dizinine yazma izni yok`, 'error', 500);
      }
    }

    return {
      status: 'success',
      message: 'Ortam doğrulaması başarılı'
    };
  } catch (err) {
    return handleError(err);
  }
} 