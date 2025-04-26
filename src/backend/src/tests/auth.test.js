const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('Auth Routes', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('should not register a user with existing email', async () => {
      // First registration
      await request(app).post('/api/auth/register').send(testUser);

      // Second registration with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a user before each test
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send(testUser);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('should not login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    let token;

    beforeEach(async () => {
      // Register and login to get token
      await request(app).post('/api/auth/register').send(testUser);
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send(testUser);
      token = loginRes.body.token;
    });

    it('should logout successfully with valid token', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
    });

    it('should not logout without token', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.statusCode).toBe(401);
    });
  });
}); 