const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const authMiddleware = require('../middleware/authMiddleware');

// Tüm route'lar için authentication gerekli
router.use(authMiddleware);

// Abonelik durumunu getir
router.get('/', subscriptionController.getSubscription);

// Yeni abonelik oluştur
router.post('/', subscriptionController.createSubscription);

// Abonelik planını güncelle
router.put('/', subscriptionController.updateSubscription);

// Aboneliği iptal et
router.delete('/', subscriptionController.cancelSubscription);

// Tüm planları getir (public route)
router.get('/plans', subscriptionController.getPlans);

module.exports = router; 