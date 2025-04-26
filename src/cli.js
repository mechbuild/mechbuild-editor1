import { createBackup, restoreBackup, cleanupOldBackups } from './services/backup.js';
import { initDB, createUser } from './services/db.js';
import { logActivity } from './services/logger.js';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createGzip, createGunzip } from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  try {
    // Veritabanını başlat
    await initDB();
    console.log('Veritabanı başlatıldı');

    // Komut satırı argümanlarını al
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'backup':
        await handleBackup();
        break;
      case 'restore':
        await handleRestore();
        break;
      case 'cleanup':
        await handleCleanup();
        break;
      case 'create-user':
        await handleCreateUser();
        break;
      default:
        console.log('Geçersiz komut. Kullanım:');
        console.log('  node cli.js backup       - Yedek oluştur');
        console.log('  node cli.js restore      - Yedek geri yükle');
        console.log('  node cli.js cleanup      - Eski yedekleri temizle');
        console.log('  node cli.js create-user  - Yeni kullanıcı oluştur');
    }
  } catch (error) {
    console.error('Hata:', error.message);
  } finally {
    rl.close();
  }
}

async function handleBackup() {
  try {
    const userId = await askQuestion('Kullanıcı ID: ');
    const sourcePath = await askQuestion('Yedeklenecek dosya/dizin yolu: ');

    console.log('Yedekleme başlatılıyor...');
    const result = await createBackup(userId, sourcePath);

    console.log('Yedekleme başarılı!');
    console.log('Yedek dosyası:', result.backupFile);
    console.log('Boyut:', formatSize(result.size));
  } catch (error) {
    console.error('Yedekleme hatası:', error.message);
  }
}

async function handleRestore() {
  try {
    const userId = await askQuestion('Kullanıcı ID: ');
    const backupFile = await askQuestion('Geri yüklenecek yedek dosyası: ');

    console.log('Geri yükleme başlatılıyor...');
    const result = await restoreBackup(userId, backupFile);

    console.log('Geri yükleme başarılı!');
    console.log(result.message);
  } catch (error) {
    console.error('Geri yükleme hatası:', error.message);
  }
}

async function handleCleanup() {
  try {
    const maxAge = await askQuestion('Kaç günden eski yedekler temizlensin? (varsayılan: 7): ') || 7;

    console.log('Temizleme başlatılıyor...');
    const result = await cleanupOldBackups(parseInt(maxAge));

    console.log('Temizleme başarılı!');
    console.log(`${result.cleaned} adet yedek temizlendi.`);
  } catch (error) {
    console.error('Temizleme hatası:', error.message);
  }
}

async function handleCreateUser() {
  try {
    const username = await askQuestion('Kullanıcı adı: ');
    const password = await askQuestion('Şifre: ');

    const userId = await createUser(username, password);
    console.log('Kullanıcı başarıyla oluşturuldu!');
    console.log('Kullanıcı ID:', userId);
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error.message);
  }
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Uygulamayı başlat
main(); 