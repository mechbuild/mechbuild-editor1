const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../middleware/error').AppError;

// Admin kullanıcısını oluştur (ilk kurulumda)
const createAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        password: 'mechbuildadmin2025',
        role: 'admin'
      });
      await admin.save();
      console.log('Admin kullanıcısı oluşturuldu');
    }
  } catch (error) {
    console.error('Admin kullanıcısı oluşturulamadı:', error);
  }
};

// İlk kurulumda admin kullanıcısını oluştur
createAdminUser();

// Login route
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ username });
        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new AppError('Invalid credentials', 401);
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );

        // Son giriş zamanını güncelle
        user.lastLogin = Date.now();
        await user.save();

        res.json({
            status: 'success',
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (err) {
        next(err);
    }
});

router.post('/logout', (req, res) => {
  res.json({
    status: 'success',
    message: 'Başarıyla çıkış yapıldı'
  });
});

module.exports = router; 