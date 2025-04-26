import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { AppError, handleError } from './errorHandler';

// Dosya güvenliği
export function secureFile(file) {
  try {
    // Dosya türü doğrulama
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/dxf'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new AppError('Geçersiz dosya türü', 'error', 400);
    }

    // Dosya boyutu kontrolü
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new AppError('Dosya boyutu çok büyük', 'error', 400);
    }

    // Dosya içerik doğrulama
    const buffer = Buffer.from(file.data);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    return {
      status: 'success',
      hash,
      size: file.size,
      type: file.type
    };
  } catch (err) {
    return handleError(err);
  }
}

// Kullanıcı güvenliği
export function secureUser(user) {
  try {
    // Şifre karmaşıklığı kontrolü
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(user.password)) {
      throw new AppError('Şifre yeterince güçlü değil', 'error', 400);
    }

    // Kullanıcı adı doğrulama
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(user.username)) {
      throw new AppError('Geçersiz kullanıcı adı', 'error', 400);
    }

    // Şifre hashleme
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(user.password, salt, 1000, 64, 'sha512').toString('hex');

    return {
      status: 'success',
      username: user.username,
      passwordHash: hash,
      salt
    };
  } catch (err) {
    return handleError(err);
  }
}

// Oturum güvenliği
export function secureSession(session) {
  try {
    // Oturum süresi kontrolü
    const maxAge = 24 * 60 * 60 * 1000; // 24 saat
    if (Date.now() - session.createdAt > maxAge) {
      throw new AppError('Oturum süresi doldu', 'error', 401);
    }

    // IP kontrolü
    if (session.ip !== session.lastIp) {
      console.warn('IP değişikliği tespit edildi');
      // Güvenlik önlemleri
    }

    return {
      status: 'success',
      sessionId: session.id,
      expiresAt: session.createdAt + maxAge
    };
  } catch (err) {
    return handleError(err);
  }
}

// Dizin güvenliği
export function secureDirectory(dir) {
  try {
    // Dizin izinleri kontrolü
    const stats = fs.statSync(dir);
    if (!stats.isDirectory()) {
      throw new AppError('Geçersiz dizin', 'error', 400);
    }

    // Dizin içeriği kontrolü
    const files = fs.readdirSync(dir);
    const suspiciousFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.exe', '.bat', '.sh', '.php'].includes(ext);
    });

    if (suspiciousFiles.length > 0) {
      throw new AppError('Şüpheli dosyalar tespit edildi', 'error', 403);
    }

    return {
      status: 'success',
      path: dir,
      fileCount: files.length
    };
  } catch (err) {
    return handleError(err);
  }
} 