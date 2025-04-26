const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const {
  cacheMiddleware,
  compressionMiddleware,
  optimizeRequest,
  monitorResources,
  optimizeQueries,
  trackErrors,
  getMetrics
} = require('./middleware/performance');
const {
  securityHeaders,
  securityMonitor,
  corsConfig
} = require('./middleware/security');
const logger = require('./utils/logger');
const metrics = require('./utils/metrics');
const metricsRouter = require('./routes/metrics');
const healthRouter = require('./routes/health');

const app = express();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Performance middleware
app.use(compressionMiddleware);
app.use(optimizeRequest);
app.use(monitorResources);
app.use(optimizeQueries);

// Güvenlik middleware'lerini uygula
app.use(securityHeaders);
app.use(securityMonitor);

// Cache specific routes
app.get('/api/status', cacheMiddleware(60)); // Cache for 1 minute
app.get('/api/operations', cacheMiddleware(300)); // Cache for 5 minutes

// Metrics endpoint
app.get('/api/metrics', (req, res) => {
  res.json(getMetrics());
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Metrics endpoint
app.use('/metrics', metricsRouter);

// Health check endpoint
app.use('/health', healthRouter);

// Hata yakalama middleware'i
app.use(trackErrors);

// Routes
app.use('/api', require('./routes'));

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
  res.status(404).json({
    error: 'Sayfa bulunamadı'
  });
});

module.exports = app; 