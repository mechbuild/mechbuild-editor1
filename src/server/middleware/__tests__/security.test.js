const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const {
  helmetConfig,
  limiter,
  securityHeaders,
  authenticateToken,
  validateApiKey,
  upload,
  securityMonitor,
  corsConfig
} = require('../security');
const logger = require('../../utils/logger');

// Mock logger
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}));

describe('Security Middleware', () => {
  let app;
  let server;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(helmetConfig);
    app.use(securityHeaders);
    app.use(securityMonitor);

    // Test route
    app.get('/test', (req, res) => res.json({ message: 'success' }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Helmet Configuration', () => {
    it('should set security headers', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });

  describe('Rate Limiting', () => {
    it('should limit requests', async () => {
      app.use('/api', limiter);
      
      // Make multiple requests
      for (let i = 0; i < 101; i++) {
        await request(app).get('/api/test');
      }

      const response = await request(app).get('/api/test');
      expect(response.status).toBe(429);
      expect(response.body.error).toBe('Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.');
    });
  });

  describe('API Key Validation', () => {
    it('should reject requests without API key', async () => {
      app.use('/api', validateApiKey);
      
      const response = await request(app).get('/api/test');
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Geçersiz API anahtarı');
    });

    it('should accept requests with valid API key', async () => {
      app.use('/api', validateApiKey);
      
      const response = await request(app)
        .get('/api/test')
        .set('X-API-Key', process.env.API_KEY);
      
      expect(response.status).toBe(200);
    });
  });

  describe('JWT Authentication', () => {
    const validToken = jwt.sign({ userId: '123' }, process.env.JWT_SECRET);
    
    it('should reject requests without token', async () => {
      app.use('/api/upload', authenticateToken);
      
      const response = await request(app).post('/api/upload');
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Yetkilendirme token\'ı bulunamadı');
    });

    it('should reject requests with invalid token', async () => {
      app.use('/api/upload', authenticateToken);
      
      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Geçersiz token');
    });

    it('should accept requests with valid token', async () => {
      app.use('/api/upload', authenticateToken);
      
      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).toBe(200);
    });
  });

  describe('File Upload Security', () => {
    it('should reject files larger than max size', async () => {
      const largeFile = Buffer.alloc(11 * 1024 * 1024); // 11MB
      
      const response = await request(app)
        .post('/api/upload')
        .attach('file', largeFile, 'test.xlsx');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Dosya boyutu çok büyük. Maksimum 10MB yükleyebilirsiniz.');
    });

    it('should reject invalid file types', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('test'), 'test.exe');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Geçersiz dosya tipi. Sadece PDF, Excel, CSV ve JSON dosyaları yükleyebilirsiniz.');
    });
  });

  describe('Security Monitoring', () => {
    it('should log suspicious IP addresses', async () => {
      await request(app)
        .get('/test')
        .set('X-Forwarded-For', '127.0.0.1');
      
      expect(logger.warn).toHaveBeenCalledWith(
        'Suspicious IP detected',
        expect.objectContaining({ ip: '127.0.0.1' })
      );
    });

    it('should log suspicious user agents', async () => {
      await request(app)
        .get('/test')
        .set('User-Agent', 'curl/7.68.0');
      
      expect(logger.warn).toHaveBeenCalledWith(
        'Suspicious user agent detected',
        expect.objectContaining({ userAgent: 'curl/7.68.0' })
      );
    });
  });

  describe('CORS Configuration', () => {
    it('should reject requests from unauthorized origins', async () => {
      app.use(cors(corsConfig));
      
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://malicious-site.com');
      
      expect(response.status).toBe(403);
    });

    it('should accept requests from authorized origins', async () => {
      app.use(cors(corsConfig));
      
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:3000');
      
      expect(response.status).toBe(200);
    });
  });
}); 