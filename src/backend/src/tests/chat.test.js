const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('Chat Routes', () => {
  let token;
  let receiverId;
  let testUser;
  let receiverUser;

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    });

    // Create receiver user
    receiverUser = await User.create({
      email: 'receiver@example.com',
      password: 'password123',
      name: 'Receiver User'
    });

    // Login to get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    token = response.body.token;
    receiverId = receiverUser._id.toString();
  });

  afterEach(async () => {
    // Clean up test users
    await User.deleteMany({});
  });

  describe('POST /api/chat/messages', () => {
    it('should send a message successfully', async () => {
      const response = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          receiverId,
          content: 'Test message'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data.message).toHaveProperty('content', 'Test message');
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/chat/messages')
        .send({
          receiverId,
          content: 'Test message'
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Test message'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/chat/messages/:userId', () => {
    it('should get messages between users', async () => {
      // First send a message
      await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          receiverId,
          content: 'Test message'
        });

      const response = await request(app)
        .get(`/api/chat/messages/${receiverId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(Array.isArray(response.body.data.messages)).toBe(true);
      expect(response.body.data.messages).toHaveLength(1);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get(`/api/chat/messages/${receiverId}`);

      expect(response.status).toBe(401);
    });
  });
}); 