const User = require('../models/User');
const Log = require('../models/Log');
const AuditLog = require('../models/AuditLog');

const adminController = {
  // User management methods
  getUsers: async (req, res) => {
    try {
      const users = await User.find().select('-password');
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
  },

  createUser: async (req, res) => {
    try {
      const { username, email, password, role } = req.body;
      const user = new User({ username, email, password, role });
      await user.save();
      res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
      res.status(400).json({ message: 'Error creating user', error: error.message });
    }
  },

  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }
      const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
      res.json({ message: 'User updated successfully', user });
    } catch (error) {
      res.status(400).json({ message: 'Error updating user', error: error.message });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      await User.findByIdAndDelete(id);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(400).json({ message: 'Error deleting user', error: error.message });
    }
  },

  // System logs methods
  getLogs: async (req, res) => {
    try {
      const logs = await Log.find().sort({ timestamp: -1 });
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching logs', error: error.message });
    }
  },

  getLogById: async (req, res) => {
    try {
      const { id } = req.params;
      const log = await Log.findById(id);
      if (!log) {
        return res.status(404).json({ message: 'Log not found' });
      }
      res.json(log);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching log', error: error.message });
    }
  },

  // Settings audit methods
  getAuditLogs: async (req, res) => {
    try {
      const auditLogs = await AuditLog.find().sort({ timestamp: -1 });
      res.json(auditLogs);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching audit logs', error: error.message });
    }
  },

  getAuditLogById: async (req, res) => {
    try {
      const { id } = req.params;
      const auditLog = await AuditLog.findById(id);
      if (!auditLog) {
        return res.status(404).json({ message: 'Audit log not found' });
      }
      res.json(auditLog);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching audit log', error: error.message });
    }
  }
};

module.exports = adminController; 