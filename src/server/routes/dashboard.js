const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const Project = require('../models/Project');

// Location-based project summary
router.get('/by-location', async (req, res) => {
    try {
        const locations = {
            "İstanbul": 5,
            "Ankara": 3,
            "İzmir": 2
        };
        res.json(locations);
    } catch (error) {
        res.status(500).json({ error: 'Lokasyon bazlı proje sayıları alınamadı' });
    }
});

// Dashboard stats endpoint
router.get("/stats", async (req, res) => {
    try {
        const stats = {
            totalProjects: 10,
            activeProjects: 5,
            totalUsers: 20,
            recentActivity: []
        };
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Dashboard istatistikleri alınırken bir hata oluştu' 
        });
    }
});

// Recent activity endpoint
router.get("/activity", async (req, res) => {
    try {
        const activities = [
            { id: 1, type: 'project_created', description: 'Yeni proje oluşturuldu', timestamp: new Date() },
            { id: 2, type: 'file_uploaded', description: 'Dosya yüklendi', timestamp: new Date() }
        ];
        res.json({ success: true, data: activities });
    } catch (error) {
        console.error('Dashboard Activity Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Son aktiviteler alınırken bir hata oluştu' 
        });
    }
});

module.exports = router; 