const User = require('../models/User');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

class UserRepository {
  async create(data) {
    try {
      const user = await User.create(data);
      logger.info(`User created in repository: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Repository error creating user:', error);
      throw new AppError('Error creating user in repository', 500);
    }
  }

  async findByEmail(email) {
    try {
      return await User.findOne({ email });
    } catch (error) {
      logger.error('Repository error finding user by email:', error);
      throw new AppError('Error finding user by email in repository', 500);
    }
  }

  async findById(id) {
    try {
      return await User.findById(id);
    } catch (error) {
      logger.error('Repository error finding user by id:', error);
      throw new AppError('Error finding user by id in repository', 500);
    }
  }

  async update(id, data) {
    try {
      const user = await User.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true
      });
      if (!user) {
        throw new AppError('User not found in repository', 404);
      }
      logger.info(`User updated in repository: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Repository error updating user:', error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const user = await User.findByIdAndDelete(id);
      if (!user) {
        throw new AppError('User not found in repository', 404);
      }
      logger.info(`User deleted from repository: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Repository error deleting user:', error);
      throw error;
    }
  }
}

module.exports = new UserRepository(); 