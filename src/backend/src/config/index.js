import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create necessary directories
const uploadsDir = path.join(__dirname, '..', 'uploads');
const logsDir = path.join(__dirname, '..', 'logs');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (err) {
  console.error('Failed to create directories:', err);
}

const config = {
  port: 3001,
  mongoUri: 'mongodb+srv://mechbuildpro:Melisa2010@cluster0.6gzhnhy.mongodb.net/mechbuild?retryWrites=true&w=majority',
  jwtSecret: 'your-secret-key',
  jwtExpiration: '24h',
  corsOptions: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  upload: {
    dest: uploadsDir,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB
    }
  },
  logging: {
    level: 'info',
    filename: path.join(logsDir, 'app.log'),
    maxFiles: '14d'
  }
};

export default config;
