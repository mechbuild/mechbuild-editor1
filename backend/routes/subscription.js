const express = require('express');
const router = express.Router();

// Controller'ı import et
const path = require('path');
const controllerPath = path.resolve(__dirname, '../../src/controllers/subscriptionController.js');
const subscriptionController = require(controllerPath);

// GET /api/subscription
router.get('/', subscriptionController.getSubscription);
// POST /api/subscription
router.post('/', subscriptionController.createSubscription);
// PUT /api/subscription
router.put('/', subscriptionController.updateSubscription);
// DELETE /api/subscription
router.delete('/', subscriptionController.cancelSubscription);
// GET /api/subscription/plans
router.get('/plans', subscriptionController.getPlans);

module.exports = router; 