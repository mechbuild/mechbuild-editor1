const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.use(authMiddleware);

// Get user profile
router.get('/profile', userController.getProfile);

// Update user profile
router.put('/profile', userController.updateProfile);

// Change password
router.put('/password', userController.changePassword);

// Get all users (admin only)
router.get('/', userController.getAllUsers);

// Get user by ID (admin only)
router.get('/:id', userController.getUserById);

// Update user (admin only)
router.put('/:id', userController.updateUser);

// Delete user (admin only)
router.delete('/:id', userController.deleteUser);

module.exports = router; 