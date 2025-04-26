const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const { AppError } = require('../middleware/error');
const User = require('../models/User');
const Project = require('../models/Project');

// Admin middleware
const adminMiddleware = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok.' });
    }
    next();
};

router.use(adminMiddleware);

// Kullanıcı listesi
router.get('/users', async (req, res, next) => {
    try {
        const users = await User.find().select('-password');
        res.json({
            status: 'success',
            data: {
                users
            }
        });
    } catch (error) {
        next(new AppError(error.message, 500));
    }
});

// Kullanıcı oluştur
router.post('/users', async (req, res, next) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return next(new AppError('Kullanıcı adı ve şifre gereklidir', 400));
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return next(new AppError('Bu kullanıcı adı zaten kullanılıyor', 400));
    }

    const user = new User({
      username,
      password,
      role: role || 'user'
    });

    await user.save();

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          username: user.username,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Kullanıcı güncelle
router.put('/users/:id', async (req, res, next) => {
  try {
    const { username, password, role, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError('Kullanıcı bulunamadı', 404));
    }

    if (username) user.username = username;
    if (password) user.password = password;
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    res.json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          isActive: user.isActive
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Kullanıcı sil
router.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new AppError('Kullanıcı bulunamadı', 404));
    }

    // Admin kullanıcısını silmeye izin verme
    if (user.role === 'admin') {
      return next(new AppError('Admin kullanıcısı silinemez', 403));
    }

    await user.remove();

    res.json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
});

// Sistem istatistikleri
router.get('/stats', async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalProjects,
      activeProjects,
      totalFiles
    ] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Project.countDocuments({ status: 'active' }),
      Project.aggregate([
        { $unwind: '$files' },
        { $count: 'total' }
      ])
    ]);

    res.json({
      status: 'success',
      data: {
        stats: {
          totalUsers,
          totalProjects,
          activeProjects,
          totalFiles: totalFiles[0]?.total || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Sistem logları
router.get('/logs', async (req, res, next) => {
  try {
    const projects = await Project.find()
      .select('name logs')
      .sort({ 'logs.timestamp': -1 })
      .limit(100);

    const logs = projects.flatMap(project => 
      project.logs.map(log => ({
        project: project.name,
        ...log.toObject()
      }))
    );

    res.json({
      status: 'success',
      data: {
        logs
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 