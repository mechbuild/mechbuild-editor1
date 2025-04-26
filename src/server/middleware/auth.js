const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      logger.warn('Authentication attempt without token');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token bulunamadı'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gizli_key');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      logger.warn(`Authentication attempt with invalid token for user ID: ${decoded.id}`);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Geçersiz token'
      });
    }

    req.user = user;
    logger.debug(`User authenticated: ${user.username}`);
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Geçersiz token'
    });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      logger.warn('Admin check attempted without authentication');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Yetkilendirme gerekli'
      });
    }

    if (req.user.role !== 'admin') {
      logger.warn(`Admin access denied for user: ${req.user.username}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin yetkisi gerekli'
      });
    }

    logger.debug(`Admin access granted for user: ${req.user.username}`);
    next();
  } catch (error) {
    logger.error('Admin check error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Bir hata oluştu'
    });
  }
};

module.exports = {
  verifyToken,
  isAdmin
}; 