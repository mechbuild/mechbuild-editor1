const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../app');
const User = require('../models/User');

describe('Upload Routes', () => {
  let token;
  const testImagePath = path.join(__dirname, 'test-image.jpg');

  beforeAll(async () => {
    // Create a test image file
    const imageBuffer = Buffer.from('fake-image-content');
    fs.writeFileSync(testImagePath, imageBuffer);

    // Register and login a test user
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    token = loginResponse.body.token;
  });

  afterAll(async () => {
    // Clean up test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    // Clean up test user
    await User.deleteMany({});
  });

  describe('POST /api/upload/profile-picture', () => {
    test('should upload a profile picture successfully', async () => {
      const response = await request(app)
        .post('/api/upload/profile-picture')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', testImagePath);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('filePath');
      expect(response.body.filePath).toMatch(/^\/uploads\/.+\.jpg$/);
    });

    test('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/upload/profile-picture')
        .attach('file', testImagePath);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });

    test('should return 400 if no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/upload/profile-picture')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });

    test('should return 400 if file type is not allowed', async () => {
      // Create a test text file
      const testTextPath = path.join(__dirname, 'test.txt');
      fs.writeFileSync(testTextPath, 'test content');

      const response = await request(app)
        .post('/api/upload/profile-picture')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', testTextPath);

      // Clean up test text file
      fs.unlinkSync(testTextPath);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });
  });
}); 