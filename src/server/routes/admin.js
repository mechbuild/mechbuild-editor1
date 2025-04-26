const express = require('express');
const Project = require('../models/Project');
const verifyToken = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Middleware to check if user is admin
const isAdminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Unauthorized' });
  }
};

// Apply admin middleware to all routes
router.use(isAdminMiddleware);

// Tüm projeleri getir (sadece admin)
router.get("/projects", verifyToken, isAdmin, async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (error) {
    console.error('Projeleri getirme hatası:', error);
    res.status(500).json({ error: 'Projeler getirilemedi' });
  }
});

// Modülleri sıfırla
router.put("/project/:id/reset-modules", verifyToken, isAdmin, async (req, res) => {
  try {
    const updated = await Project.findByIdAndUpdate(
      req.params.id, 
      { activeModules: [] }, 
      { new: true }
    );
    res.json({ message: "Modüller sıfırlandı", project: updated });
  } catch (error) {
    console.error('Modül sıfırlama hatası:', error);
    res.status(500).json({ error: 'Modüller sıfırlanamadı' });
  }
});

// Logları temizle
router.put("/project/:id/clear-logs", verifyToken, isAdmin, async (req, res) => {
  try {
    const updated = await Project.findByIdAndUpdate(
      req.params.id, 
      { logs: [] }, 
      { new: true }
    );
    res.json({ message: "Loglar temizlendi", project: updated });
  } catch (error) {
    console.error('Log temizleme hatası:', error);
    res.status(500).json({ error: 'Loglar temizlenemedi' });
  }
});

// Proje sil
router.delete("/project/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: "Proje silindi" });
  } catch (error) {
    console.error('Proje silme hatası:', error);
    res.status(500).json({ error: 'Proje silinemedi' });
  }
});

// User management routes
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// System logs routes
router.get('/logs', adminController.getLogs);
router.get('/logs/:id', adminController.getLogById);

// Settings audit routes
router.get('/audit', adminController.getAuditLogs);
router.get('/audit/:id', adminController.getAuditLogById);

module.exports = router; 