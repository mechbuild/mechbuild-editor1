// src/services/errorHandler.js

import { logActivity } from './logger.js';

export class AppError extends Error {
  constructor(message, type = 'error', code = 500, details = {}) {
    super(message);
    this.type = type;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
    this.timestamp = new Date().toISOString();
  }
}

export const errorTypes = {
  VALIDATION: 'validation',
  AUTH: 'auth',
  FILE: 'file',
  API: 'api',
  SYSTEM: 'system',
  NETWORK: 'network',
  PERMISSION: 'permission'
};

const errorMessages = {
  // Dosya işleme hataları
  'File too large': 'Dosya boyutu çok büyük (max. 10MB)',
  'Invalid file type': 'Geçersiz dosya türü. Sadece PDF, DOCX, XLSX ve DXF dosyaları yüklenebilir',
  'File not found': 'Dosya bulunamadı',
  'File read error': 'Dosya okuma hatası',
  
  // Kimlik doğrulama hataları
  'User not found': 'Kullanıcı bulunamadı',
  'Invalid password': 'Geçersiz şifre',
  'Session expired': 'Oturum süresi doldu',
  'Permission denied': 'Bu işlem için yetkiniz yok',
  
  // Ağ hataları
  'Network error': 'Ağ bağlantı hatası',
  'Server error': 'Sunucu hatası',
  'Timeout': 'İstek zaman aşımına uğradı',
  
  // Sistem hataları
  'Unexpected error': 'Beklenmeyen bir hata oluştu',
  'Database error': 'Veritabanı hatası',
  'Configuration error': 'Yapılandırma hatası'
};

export const handleError = async (error, userId = null) => {
  try {
    const errorDetails = {
      name: error.name,
      message: error.message,
      type: error.type || 'error',
      code: error.code || 500,
      details: error.details || {},
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    };

    // Hata logunu kaydet
    await logActivity({
      userId,
      action: 'error',
      details: errorDetails
    });

    // Kritik hataları bildir
    if (error.code >= 500) {
      await notifyAdmin(errorDetails);
    }

    // Kullanıcıya dönecek hata mesajını hazırla
    return {
      message: errorMessages[error.message] || error.message,
      type: error.type || errorTypes.SYSTEM,
      code: error.code || 500,
      details: error.details || {}
    };
  } catch (loggingError) {
    console.error('Hata loglama hatası:', loggingError);
    return {
      message: 'Bir hata oluştu',
      type: errorTypes.SYSTEM,
      code: 500
    };
  }
};

async function notifyAdmin(errorDetails) {
  // Bu fonksiyon gerçek bir bildirim sistemi ile değiştirilebilir
  console.log('Admin bildirimi:', errorDetails);
}

export const validateFile = (file) => {
  if (!file) {
    throw new AppError('File not found', errorTypes.FILE, 400);
  }

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/dxf'
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new AppError('Invalid file type', errorTypes.FILE, 400);
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new AppError('File too large', errorTypes.FILE, 400);
  }
};

export const logError = (error, context = '') => {
  console.error(`[${new Date().toISOString()}] ${context}:`, error);
  // Burada hataları bir log servisine gönderebiliriz
};

export class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 'validation', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message, details = {}) {
    super(message, 'authentication', 401, details);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message, details = {}) {
    super(message, 'authorization', 403, details);
    this.name = 'AuthorizationError';
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(message, details = {}) {
    super(message, 'not_found', 404, details);
    this.name = 'ResourceNotFoundError';
  }
} 