const express = require('express');
const router = express.Router();
const changelogController = require('../controllers/changelogController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get all changelog entries
router.get('/', changelogController.getChangelog);

// Get latest version
router.get('/latest', changelogController.getLatestVersion);

// Create a new changelog entry (admin only)
router.post('/', changelogController.createChangelog);

// Delete a changelog entry (admin only)
router.delete('/:id', changelogController.deleteChangelog);

module.exports = router; 