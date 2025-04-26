const Changelog = require('../models/Changelog');
const ErrorService = require('../services/errorService');

const changelogController = {
  // Get all changelog entries, sorted by version
  async getChangelog(req, res) {
    try {
      const changelog = await Changelog.find()
        .sort({ version: -1 })
        .populate('createdBy', 'username');
      res.json(changelog);
    } catch (error) {
      const errorResponse = await ErrorService.handle(error, 'Get Changelog');
      res.status(errorResponse.status).json({ message: errorResponse.message });
    }
  },

  // Get latest version
  async getLatestVersion(req, res) {
    try {
      const latest = await Changelog.findOne()
        .sort({ version: -1 })
        .select('version');
      res.json({ version: latest?.version || '0.0.0' });
    } catch (error) {
      const errorResponse = await ErrorService.handle(error, 'Get Latest Version');
      res.status(errorResponse.status).json({ message: errorResponse.message });
    }
  },

  // Create a new changelog entry (admin only)
  async createChangelog(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can create changelog entries' });
      }

      const { version, title, content, type, impact } = req.body;
      
      // Validate version format
      if (!/^\d+\.\d+\.\d+$/.test(version)) {
        return res.status(400).json({ message: 'Invalid version format. Use semantic versioning (e.g., 1.0.0)' });
      }

      const changelog = new Changelog({
        version,
        title,
        content,
        type,
        impact,
        createdBy: req.user._id
      });

      await changelog.save();
      res.status(201).json(changelog);
    } catch (error) {
      const errorResponse = await ErrorService.handle(error, 'Create Changelog');
      res.status(errorResponse.status).json({ message: errorResponse.message });
    }
  },

  // Delete a changelog entry (admin only)
  async deleteChangelog(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can delete changelog entries' });
      }

      const changelog = await Changelog.findByIdAndDelete(req.params.id);

      if (!changelog) {
        return res.status(404).json({ message: 'Changelog entry not found' });
      }

      res.json({ message: 'Changelog entry deleted successfully' });
    } catch (error) {
      const errorResponse = await ErrorService.handle(error, 'Delete Changelog');
      res.status(errorResponse.status).json({ message: errorResponse.message });
    }
  }
};

module.exports = changelogController; 