import fs from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOG_DIR = join(process.cwd(), 'logs');

export async function logActivity({ userId, action, details }) {
  try {
    // Log dizinini oluştur
    await fs.mkdir(LOG_DIR, { recursive: true });

    // Log dosyası adını oluştur
    const date = new Date().toISOString().split('T')[0];
    const logFile = join(LOG_DIR, `activity-${date}.log`);

    // Log kaydını hazırla
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      details
    };

    // Log kaydını dosyaya ekle
    await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');

    // Geliştirme ortamında konsola da yazdır
    if (process.env.NODE_ENV === 'development') {
      console.log('Log kaydı:', logEntry);
    }
  } catch (error) {
    console.error('Log kaydı oluşturulamadı:', error);
  }
}

export async function getLogs(date) {
  try {
    const logFile = join(LOG_DIR, `activity-${date}.log`);
    const content = await fs.readFile(logFile, 'utf-8');
    return content.split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
  } catch (error) {
    console.error('Loglar okunamadı:', error);
    return [];
  }
} 