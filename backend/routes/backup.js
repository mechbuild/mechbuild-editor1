const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const AppError = require('../middleware/error').AppError;

// Create backup
router.post('/create', async (req, res, next) => {
    try {
        const backupDir = path.join(__dirname, '../../backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `backup-${timestamp}.json`);

        // Get all collections from database
        const collections = await mongoose.connection.db.listCollections().toArray();
        const backupData = {};

        for (const collection of collections) {
            const data = await mongoose.connection.db.collection(collection.name).find({}).toArray();
            backupData[collection.name] = data;
        }

        // Write backup to file
        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

        res.json({ 
            message: 'Backup created successfully',
            path: backupPath
        });
    } catch (err) {
        next(new AppError('Failed to create backup', 500));
    }
});

// Restore backup
router.post('/restore', async (req, res, next) => {
    try {
        const { backupPath } = req.body;

        if (!backupPath || !fs.existsSync(backupPath)) {
            throw new AppError('Invalid backup path', 400);
        }

        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

        // Clear existing collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const collection of collections) {
            await mongoose.connection.db.collection(collection.name).deleteMany({});
        }

        // Restore data
        for (const [collectionName, data] of Object.entries(backupData)) {
            if (data.length > 0) {
                await mongoose.connection.db.collection(collectionName).insertMany(data);
            }
        }

        res.json({ message: 'Backup restored successfully' });
    } catch (err) {
        next(new AppError('Failed to restore backup', 500));
    }
});

module.exports = router; 