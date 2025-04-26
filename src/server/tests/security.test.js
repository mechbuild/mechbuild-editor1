const request = require('supertest');
const app = require('../app');
const { pool } = require('../config/database');
const { createToken } = require('../utils/auth');
const { checkApiKey } = require('../middleware/security');

describe('Security Tests', () => {
  let validToken;
  let invalidToken;
  let validApiKey;
  let invalidApiKey;

  beforeAll(async () => {
    // Test için gerekli verileri oluştur
    validToken = createToken({ userId: 'test-user' });
    invalidToken = 'invalid.token.here';
    validApiKey = process.env.API_KEY;
    invalidApiKey = 'invalid-api-key';
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('JWT Authentication', () => {
    test('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/status')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
    });

    test('should deny access without token', async () => {
      const response = await request(app)
        .get('/api/status');

      expect(response.status).toBe(401);
    });

    test('should deny access with invalid token', async () => {
      const response = await request(app)
        .get('/api/status')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('API Key Validation', () => {
    test('should allow access with valid API key', async () => {
      const req = {
        headers: {
          'x-api-key': validApiKey
        }
      };
      const res = {};
      const next = jest.fn();

      await checkApiKey(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('should deny access with invalid API key', async () => {
      const req = {
        headers: {
          'x-api-key': invalidApiKey
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await checkApiKey(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Rate Limiting', () => {
    test('should allow requests within rate limit', async () => {
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .get('/api/status')
          .set('Authorization', `Bearer ${validToken}`);

        expect(response.status).toBe(200);
      }
    });

    test('should block requests exceeding rate limit', async () => {
      // Rate limit'i aşacak şekilde istek gönder
      for (let i = 0; i < 15; i++) {
        await request(app)
          .get('/api/status')
          .set('Authorization', `Bearer ${validToken}`);
      }

      const response = await request(app)
        .get('/api/status')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(429);
    });
  });

  describe('File Upload Security', () => {
    test('should accept valid file types', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', 'test/files/valid.xlsx');

      expect(response.status).toBe(200);
    });

    test('should reject invalid file types', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', 'test/files/invalid.exe');

      expect(response.status).toBe(415);
    });

    test('should enforce file size limit', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', 'test/files/large.xlsx');

      expect(response.status).toBe(413);
    });
  });

  describe('CORS Configuration', () => {
    test('should allow requests from allowed origins', async () => {
      const response = await request(app)
        .get('/api/status')
        .set('Origin', 'https://allowed-origin.com');

      expect(response.headers['access-control-allow-origin']).toBe('https://allowed-origin.com');
    });

    test('should block requests from disallowed origins', async () => {
      const response = await request(app)
        .get('/api/status')
        .set('Origin', 'https://disallowed-origin.com');

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
}); 