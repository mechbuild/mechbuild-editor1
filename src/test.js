import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { backupProject, restoreProject, autoBackup, cleanupBackups } from './services/backup.js';
import { AppError, ValidationError, AuthenticationError, AuthorizationError, ResourceNotFoundError } from './services/customErrors.js';
import { handleError } from './services/errorHandler.js';
import { createSession, verifyToken, requireAuth, requireRole, createUser } from './services/auth.js';
import { initDB } from './services/db.js';

// Test kullanıcısı oluştur
async function createTestUser() {
  try {
    const user = await createUser('testuser', 'password123', 'admin');
    console.log('Test user created:', user);
    return user;
  } catch (error) {
    if (error.message.includes('zaten kullanılıyor')) {
      console.log('Test user already exists');
    } else {
      console.error('Failed to create test user:', error);
    }
  }
}

// Test fonksiyonları
async function testBackupService(userId) {
  try {
    console.log('\nTesting backup service...');
    
    // Test dizini oluştur
    const testDir = join(__dirname, 'test-project');
    await fs.mkdir(testDir, { recursive: true });
    
    // Test dosyası oluştur
    const testFile = join(testDir, 'test.txt');
    await fs.writeFile(testFile, 'Test içeriği');
    
    // Proje yedekleme testi
    const backupResult = await backupProject(testDir, userId);
    console.log('Backup result:', backupResult);
    
    // Otomatik yedekleme testi
    const autoBackupResult = await autoBackup(userId);
    console.log('Auto backup result:', autoBackupResult);
    
    // Eski yedekleri temizleme testi
    const cleanupResult = await cleanupBackups(7 * 24 * 60 * 60 * 1000, userId);
    console.log('Cleanup result:', cleanupResult);
    
    // Test dizinini temizle
    await fs.rm(testDir, { recursive: true, force: true });
    
  } catch (error) {
    console.error('Backup service test failed:', error);
  }
}

async function testErrorHandler() {
  try {
    console.log('\nTesting error handler...');
    
    // Farklı hata türlerini test et
    const errors = [
      new ValidationError('Geçersiz giriş'),
      new AuthenticationError('Kimlik doğrulama hatası'),
      new AuthorizationError('Yetkilendirme hatası'),
      new ResourceNotFoundError('Kaynak bulunamadı'),
      new AppError('Genel hata', 500)
    ];
    
    for (const error of errors) {
      const handledError = await handleError(error);
      console.log('Handled error:', handledError);
    }
    
  } catch (error) {
    console.error('Error handler test failed:', error);
  }
}

async function testAuthService() {
  try {
    console.log('\nTesting auth service...');
    
    // Test kullanıcısı oluştur
    const testUser = {
      id: 1,
      username: 'test@example.com',
      role: 'admin'
    };
    
    // Oturum oluşturma testi
    const session = await createSession(testUser);
    console.log('Created session:', session);
    
    // Token doğrulama testi
    const verifiedToken = await verifyToken(session.token);
    console.log('Verified token:', verifiedToken);
    
  } catch (error) {
    console.error('Auth service test failed:', error);
  }
}

// Veritabanını başlat ve test kullanıcısını oluştur
await initDB();
const testUser = await createTestUser();

// Tüm testleri çalıştır
async function runAllTests() {
  console.log('Starting all service tests...\n');
  
  await testBackupService(testUser?.id || 1);
  await testErrorHandler();
  await testAuthService();
  
  console.log('\nAll tests completed!');
}

// Testleri başlat
runAllTests().catch(console.error); 