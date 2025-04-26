const User = require('../models/User');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

class UserService {
  async createUser(userData) {
    try {
      const user = await User.create(userData);
      logger.info(`User created: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw new AppError('Error creating user', 500);
    }
  }

  async findUserByEmail(email) {
    try {
      const user = await User.findOne({ email });
      return user;
    } catch (error) {
      logger.error('Error finding user:', error);
      throw new AppError('Error finding user', 500);
    }
  }

  async updateUserProfile(userId, updateData) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );
      if (!user) {
        throw new AppError('User not found', 404);
      }
      logger.info(`User profile updated: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }
      logger.info(`User deleted: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }
}

module.exports = new UserService(); 