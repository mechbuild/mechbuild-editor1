const express = require('express');
const { verifyToken, isAdmin } = require('../middleware/auth');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Create backup
router.post('/create', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}.json`);
    const collections = await mongoose.connection.db.listCollections().toArray();
    const backupData = {};
    for (const collection of collections) {
      const data = await mongoose.connection.db.collection(collection.name).find({}).toArray();
      backupData[collection.name] = data;
    }
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    res.json({ message: 'Backup created successfully', path: backupPath });
  } catch (err) {
    next(err);
  }
});

// Restore backup
router.post('/restore', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { backupPath } = req.body;
    if (!backupPath || !fs.existsSync(backupPath)) {
      return res.status(400).json({ error: 'Invalid backup path' });
    }
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const collection of collections) {
      await mongoose.connection.db.collection(collection.name).deleteMany({});
    }
    for (const [collectionName, data] of Object.entries(backupData)) {
      if (data.length > 0) {
        await mongoose.connection.db.collection(collectionName).insertMany(data);
      }
    }
    res.json({ message: 'Backup restored successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router; 