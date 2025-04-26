require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const User = require('./models/User');
const Project = require('./models/Project');
const upload = multer({ dest: 'uploads/' });
const AIService = require('./services/aiService');
const ReportService = require('./services/reportService');
const Report = require('./models/Report');
const fs = require('fs').promises;
const ReportTemplate = require('./models/ReportTemplate');
const archiver = require('archiver');
const BackupService = require('./services/backupService');
const ExportService = require('./services/exportService');
const aiRoutes = require('./routes/ai');
const dashboardRoutes = require('./routes/dashboard');
const fileRoutes = require('./routes/files');
const pdfRoutes = require('./routes/pdfRoutes');
const adminRoutes = require('./routes/admin');
const monitoringRoutes = require('./routes/monitoring');
const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const backupRoutes = require('./routes/backup');
const {
  limiter,
  csrfProtection,
  securityHeaders,
  validateInput,
  xss,
  mongoSanitize,
  hpp,
  verifyToken,
  isAdmin,
  errorHandler,
  requestLogger,
  performanceMonitor,
  securityAudit,
  apiLimiter,
  fileSecurity,
  helmetConfig,
  validateFileContent
} = require('./middleware');
const morgan = require('morgan');
const expressStatusMonitor = require('express-status-monitor');
const { logger } = require('./utils/logger');
const healthCheck = require('node-health-check');
const requestMonitoringMiddleware = require('./middleware/requestMonitor');

const app = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'gizli_key';

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../../public')));
app.use(morgan('dev'));
app.use(expressStatusMonitor());
app.use(securityHeaders);
app.use(helmetConfig);
app.use(csrfProtection);
app.use(xss());
app.use(mongoSanitize());
app.use(hpp());

// Request Monitoring
app.use(requestMonitoringMiddleware);

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/backup', backupRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    logger.info(`Server started on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Starting graceful shutdown...');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason: reason.message, promise });
});

module.exports = app; 