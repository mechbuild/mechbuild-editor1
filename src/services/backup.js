// src/services/backup.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { AppError, handleError } from './errorHandler.js';
import { logActivity } from './logger.js';
import { checkPermission } from './auth.js';
import crypto from 'crypto';
import * as tar from 'tar';
import { ValidationError, AuthenticationError, ResourceNotFoundError } from './customErrors.js';
import { getDB } from './db.js';
import fsPromises from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MAX_BACKUP_SIZE = 1024 * 1024 * 1024; // 1GB
const ALLOWED_FILE_TYPES = ['.dxf', '.pdf', '.txt', '.json'];
const BACKUP_DIR = join(process.cwd(), 'backups');

// Yedekleme dizinini oluştur
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Dosya türü kontrolü
function validateFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ALLOWED_FILE_TYPES.includes(ext);
}

// Dosya boyutu kontrolü
function validateFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size <= MAX_BACKUP_SIZE;
}

// Dosya bütünlüğü kontrolü
function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('error', reject);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

// Dosya izinleri kontrolü
function checkFilePermissions(filePath, requiredPermissions) {
  try {
    fs.accessSync(filePath, requiredPermissions);
    return true;
  } catch (error) {
    return false;
  }
}

// Dizin yedekleme işlemi
async function backupDirectory(dirPath, outputStream) {
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      await backupDirectory(filePath, outputStream);
    } else if (stats.isFile()) {
      if (!validateFileType(filePath)) {
        throw new AppError(`Geçersiz dosya türü: ${file}`, 'error', 400);
      }
      if (!validateFileSize(filePath)) {
        throw new AppError(`Dosya boyutu çok büyük: ${file}`, 'error', 400);
      }
      
      const fileContent = fs.readFileSync(filePath);
      outputStream.write(fileContent);
    }
  }
}

// Yedekleme işlemi
export async function backupProject(projectPath, userId) {
  try {
    if (!projectPath) {
      throw new ValidationError('Proje dizini belirtilmedi');
    }

    if (!userId) {
      throw new AuthenticationError('Kullanıcı kimliği gerekli');
    }

    // Dizin varlığını kontrol et
    try {
      const stats = await fsPromises.stat(projectPath);
      if (!stats.isDirectory()) {
        throw new ResourceNotFoundError('Belirtilen yol bir dizin değil');
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new ResourceNotFoundError('Proje dizini bulunamadı');
      }
      throw error;
    }

    // Yedekleme dizinini oluştur
    const backupDir = join(process.cwd(), 'backups', userId.toString());
    await fsPromises.mkdir(backupDir, { recursive: true });

    // Yedek dosya adını oluştur
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.tar.gz`;
    const backupPath = join(backupDir, backupFileName);

    // Yedekleme işlemi
    await tar.c({
      gzip: true,
      file: backupPath,
      cwd: projectPath
    }, ['.']);

    // Yedekleme kaydını veritabanına ekle
    const db = await getDB();
    await db.run(
      'INSERT INTO backups (user_id, path, created_at) VALUES (?, ?, ?)',
      [userId, backupPath, new Date()]
    );

    return {
      status: 'success',
      message: 'Yedekleme başarıyla tamamlandı',
      backupPath
    };
  } catch (error) {
    await handleError(error, userId);
    throw error;
  }
}

// Kurtarma işlemi
export async function restoreProject(backupPath, targetPath, userId) {
  try {
    // Yetki kontrolü
    if (!await checkPermission(userId, 'backup:restore')) {
      throw new AppError('Bu işlem için yetkiniz yok', 'error', 403);
    }

    // Yedek dosyasını kontrol et
    if (!fs.existsSync(backupPath)) {
      throw new AppError('Yedek dosyası bulunamadı', 'error', 404);
    }

    // Dosya izinleri kontrolü
    if (!checkFilePermissions(backupPath, fs.constants.R_OK)) {
      throw new AppError('Yedek dosyasına okuma izniniz yok', 'error', 403);
    }

    // Hedef dizini kontrol et
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    // Dosya izinleri kontrolü
    if (!checkFilePermissions(targetPath, fs.constants.W_OK)) {
      throw new AppError('Hedef dizine yazma izniniz yok', 'error', 403);
    }

    // Kurtarma işlemi
    await tar.extract({
      file: backupPath,
      cwd: targetPath
    });

    // İşlem logla
    await logActivity({
      userId,
      action: 'backup_restore',
      details: {
        backupPath,
        targetPath
      }
    });

    return {
      status: 'success',
      restoredPath: targetPath,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return handleError(err);
  }
}

// Otomatik yedekleme
export async function autoBackup(userId) {
  try {
    // Yetki kontrolü
    if (!await checkPermission(userId, 'backup:auto')) {
      throw new AppError('Bu işlem için yetkiniz yok', 'error', 403);
    }

    const projectsDir = join(__dirname, '../../projects');
    const backupDir = join(__dirname, '../../backups');

    // Proje dizinlerini kontrol et
    if (!fs.existsSync(projectsDir)) {
      fs.mkdirSync(projectsDir, { recursive: true });
    }

    // Yedekleme dizinini kontrol et
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Projeleri yedekle
    const projects = fs.readdirSync(projectsDir);
    const backups = [];

    for (const project of projects) {
      const projectPath = path.join(projectsDir, project);
      if (fs.statSync(projectPath).isDirectory()) {
        const backup = await backupProject(projectPath, userId);
        backups.push(backup);
      }
    }

    // İşlem logla
    await logActivity({
      userId,
      action: 'backup_auto',
      details: {
        projectCount: projects.length,
        backupCount: backups.length
      }
    });

    return {
      status: 'success',
      backups,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return handleError(err);
  }
}

// Yedekleme temizleme
export async function cleanupBackups(maxAge = 7 * 24 * 60 * 60 * 1000, userId) { // 7 gün
  try {
    // Yetki kontrolü
    if (!await checkPermission(userId, 'backup:cleanup')) {
      throw new AppError('Bu işlem için yetkiniz yok', 'error', 403);
    }

    const backupDir = join(__dirname, '../../backups');
    const now = Date.now();

    if (!fs.existsSync(backupDir)) {
      throw new AppError('Yedekleme dizini bulunamadı', 'error', 404);
    }

    const backups = fs.readdirSync(backupDir);
    const deleted = [];

    for (const backup of backups) {
      const backupPath = path.join(backupDir, backup);
      const stats = fs.statSync(backupPath);
      const age = now - stats.mtimeMs;

      if (age > maxAge) {
        fs.unlinkSync(backupPath);
        deleted.push(backup);
      }
    }

    // İşlem logla
    await logActivity({
      userId,
      action: 'backup_cleanup',
      details: {
        deletedCount: deleted.length,
        maxAge
      }
    });

    return {
      status: 'success',
      deleted,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return handleError(err);
  }
}

export async function createBackup(userId, sourcePath) {
  try {
    // Yedek dizinini oluştur
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    // Yedek dosyası adını oluştur
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = join(BACKUP_DIR, `backup-${timestamp}.tar.gz`);

    // Kaynak dosyaları sıkıştır
    const sourceStream = fs.createReadStream(sourcePath);
    const gzipStream = createGzip();
    const destStream = fs.createWriteStream(backupFile);

    await pipeline(sourceStream, gzipStream, destStream);

    // Yedek boyutunu al
    const stats = await fs.stat(backupFile);
    const size = stats.size;

    // Veritabanına kaydet
    const db = await getDB();
    await db.run(
      'INSERT INTO backups (user_id, filename, size) VALUES (?, ?, ?)',
      [userId, backupFile, size]
    );

    // Log kaydı oluştur
    await logActivity({
      userId,
      action: 'backup_created',
      details: `Backup created: ${backupFile} (${size} bytes)`
    });

    return {
      success: true,
      backupFile,
      size
    };
  } catch (error) {
    console.error('Yedekleme başarısız:', error);
    throw error;
  }
}

export async function restoreBackup(userId, backupFile) {
  try {
    // Yedek dosyasının varlığını kontrol et
    await fs.access(backupFile);

    // Yedek bilgilerini veritabanından kontrol et
    const db = await getDB();
    const backup = await db.get(
      'SELECT * FROM backups WHERE filename = ? AND user_id = ?',
      [backupFile, userId]
    );

    if (!backup) {
      throw new Error('Yedek bulunamadı veya erişim izniniz yok');
    }

    // Yedek dosyasını aç
    const sourceStream = fs.createReadStream(backupFile);
    const gunzipStream = createGzip();
    const destStream = fs.createWriteStream(join(process.cwd(), 'restored'));

    await pipeline(sourceStream, gunzipStream, destStream);

    // Log kaydı oluştur
    await logActivity({
      userId,
      action: 'backup_restored',
      details: `Backup restored: ${backupFile}`
    });

    return {
      success: true,
      message: 'Yedek başarıyla geri yüklendi'
    };
  } catch (error) {
    console.error('Geri yükleme başarısız:', error);
    throw error;
  }
}

export async function cleanupOldBackups(maxAge = 7) {
  try {
    const db = await getDB();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAge);

    // Eski yedekleri veritabanından sil
    const result = await db.run(
      'DELETE FROM backups WHERE created_at < ?',
      [cutoffDate.toISOString()]
    );

    // Log kaydı oluştur
    await logActivity({
      userId: null,
      action: 'backup_cleanup',
      details: `Cleaned up ${result.changes} old backups`
    });

    return {
      success: true,
      cleaned: result.changes
    };
  } catch (error) {
    console.error('Temizleme başarısız:', error);
    throw error;
  }
} 