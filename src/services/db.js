import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { DatabaseError } from './customErrors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(process.cwd(), 'database.sqlite');

let db = null;

export async function initDB() {
  try {
    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    // Kullanıcılar tablosu
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Yedekler tablosu
    await db.exec(`
      CREATE TABLE IF NOT EXISTS backups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        size INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Aktivite logları tablosu
    await db.exec(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    await db.close();
    return true;
  } catch (error) {
    console.error('Veritabanı başlatılamadı:', error);
    throw error;
  }
}

export async function getDB() {
  return await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });
}

export async function closeDB() {
  if (db) {
    await db.close();
    db = null;
  }
}

export async function checkPermission(userId, permission) {
  try {
    const db = await getDB();
    const result = await db.get(
      'SELECT 1 FROM permissions WHERE user_id = ? AND permission = ?',
      [userId, permission]
    );
    return !!result;
  } catch (error) {
    throw new AppError('Yetki kontrolü hatası: ' + error.message, 'error', 500);
  }
}

export async function logActivity({ userId, action, details }) {
  try {
    const db = await getDB();
    await db.run(
      'INSERT INTO backup_logs (user_id, action, details) VALUES (?, ?, ?)',
      [userId, action, JSON.stringify(details)]
    );
  } catch (error) {
    throw new AppError('Log kayıt hatası: ' + error.message, 'error', 500);
  }
}

export async function createUser(username, password) {
  const db = await getDB();
  const result = await db.run(
    'INSERT INTO users (username, password) VALUES (?, ?)',
    [username, password]
  );
  return result.lastID;
} 