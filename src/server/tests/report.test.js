import request from 'supertest';
import express from 'express';
import reportRouter from '../routes/report';
import { performanceMonitor } from '../utils/performanceMonitor';

// Mock performanceMonitor
jest.mock('../utils/performanceMonitor', () => ({
  performanceMonitor: {
    getHistoricalMetrics: jest.fn(),
    getAlerts: jest.fn(),
    getRecommendations: jest.fn()
  }
}));

const app = express();
app.use(express.json());
app.use('/api/metrics', reportRouter);

describe('Report API', () => {
  const mockMetrics = [
    {
      timestamp: new Date(),
      system: {
        cpu: { usage: 50 },
        memory: { usage: 60 }
      },
      application: {
        responseTimes: { p95: 100 }
      }
    }
  ];

  const mockAlerts = [
    {
      timestamp: new Date(),
      type: 'high_cpu',
      message: 'CPU kullanımı yüksek'
    }
  ];

  const mockRecommendations = [
    {
      type: 'high_cpu',
      message: 'CPU kullanımını azaltmak için öneriler'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitor.getHistoricalMetrics.mockResolvedValue(mockMetrics);
    performanceMonitor.getAlerts.mockResolvedValue(mockAlerts);
    performanceMonitor.getRecommendations.mockResolvedValue(mockRecommendations);
  });

  describe('GET /api/metrics/report', () => {
    it('should return summary report data', async () => {
      const response = await request(app)
        .get('/api/metrics/report')
        .query({ range: '24h', type: 'summary' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('trends');
      expect(performanceMonitor.getHistoricalMetrics).toHaveBeenCalled();
    });

    it('should return detailed report data', async () => {
      const response = await request(app)
        .get('/api/metrics/report')
        .query({ range: '24h', type: 'detailed' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(performanceMonitor.getHistoricalMetrics).toHaveBeenCalled();
    });

    it('should return trends report data', async () => {
      const response = await request(app)
        .get('/api/metrics/report')
        .query({ range: '24h', type: 'trends' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(performanceMonitor.getHistoricalMetrics).toHaveBeenCalled();
    });

    it('should return alerts report data', async () => {
      const response = await request(app)
        .get('/api/metrics/report')
        .query({ range: '24h', type: 'alerts' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(performanceMonitor.getAlerts).toHaveBeenCalled();
      expect(performanceMonitor.getRecommendations).toHaveBeenCalled();
    });

    it('should handle invalid report type', async () => {
      const response = await request(app)
        .get('/api/metrics/report')
        .query({ range: '24h', type: 'invalid' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('summary');
    });

    it('should handle invalid time range', async () => {
      const response = await request(app)
        .get('/api/metrics/report')
        .query({ range: 'invalid', type: 'summary' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('summary');
    });

    it('should handle API errors gracefully', async () => {
      performanceMonitor.getHistoricalMetrics.mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .get('/api/metrics/report')
        .query({ range: '24h', type: 'summary' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/metrics/report/export', () => {
    it('should return PDF report', async () => {
      const response = await request(app)
        .get('/api/metrics/report/export')
        .query({ range: '24h', type: 'summary' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should handle invalid report type in PDF export', async () => {
      const response = await request(app)
        .get('/api/metrics/report/export')
        .query({ range: '24h', type: 'invalid' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
    });

    it('should handle API errors in PDF export', async () => {
      performanceMonitor.getHistoricalMetrics.mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .get('/api/metrics/report/export')
        .query({ range: '24h', type: 'summary' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 