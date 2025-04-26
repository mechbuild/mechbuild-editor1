import bcrypt from 'bcrypt';
import { getDB } from './db.js';
import { AppError, AuthenticationError, ValidationError } from './errorHandler.js';
import { logActivity } from './logger.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function checkPermission(userId, permission) {
  if (!userId) {
    throw new AuthenticationError('Kullanıcı kimliği gerekli');
  }

  const db = await getDB();
  const user = await db.get('SELECT role FROM users WHERE id = ?', [userId]);

  if (!user) {
    throw new AuthenticationError('Kullanıcı bulunamadı');
  }

  // Admin her şeye erişebilir
  if (user.role === 'admin') {
    return true;
  }

  // Temel izinleri kontrol et
  const basicPermissions = {
    user: ['backup:create', 'backup:restore'],
    editor: ['backup:create', 'backup:restore', 'backup:auto']
  };

  if (basicPermissions[user.role]?.includes(permission)) {
    return true;
  }

  throw new AuthenticationError('Bu işlem için yetkiniz yok');
}

export async function createUser(username, password, role) {
  if (!username || !password) {
    throw new ValidationError('Kullanıcı adı ve şifre gereklidir');
  }

  if (!['admin', 'user'].includes(role)) {
    throw new ValidationError('Geçersiz rol');
  }

  const db = await getDB();
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const result = await db.run(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role]
    );

    return {
      id: result.lastID,
      username,
      role
    };
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      throw new ValidationError('Bu kullanıcı adı zaten kullanılıyor');
    }
    throw error;
  }
}

export async function authenticateUser(username, password) {
  if (!username || !password) {
    throw new ValidationError('Kullanıcı adı ve şifre gereklidir');
  }

  const db = await getDB();
  const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

  if (!user) {
    throw new AuthenticationError('Kullanıcı bulunamadı');
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new AuthenticationError('Geçersiz şifre');
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    token
  };
}

export async function createSession(user) {
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  await logActivity({
    userId: user.id,
    action: 'login',
    details: { timestamp: new Date().toISOString() }
  });

  return {
    userId: user.id,
    token,
    expiresIn: '24h'
  };
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new AuthenticationError('Geçersiz veya süresi dolmuş token');
  }
}

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    throw new AuthenticationError('Token gerekli');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    throw new AuthenticationError('Geçersiz token');
  }
}

export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      throw new AuthenticationError('Kullanıcı kimliği gerekli');
    }

    if (!roles.includes(req.user.role)) {
      throw new AuthenticationError('Bu işlem için yetkiniz yok');
    }

    next();
  };
} 