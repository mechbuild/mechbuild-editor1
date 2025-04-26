const express = require('express');
const router = express.Router();
const AppError = require('../middleware/error').AppError;
const { getSystemMetrics, getActiveRequests, getActiveQueries, getErrorLogs, getPerformanceReport } = require('../utils/monitoring');

// Get overall system metrics
router.get('/metrics', async (req, res, next) => {
    try {
        const metrics = await getSystemMetrics();
        res.json(metrics);
    } catch (err) {
        next(new AppError('Failed to get system metrics', 500));
    }
});

// Get active requests
router.get('/requests', async (req, res, next) => {
    try {
        const requests = await getActiveRequests();
        res.json(requests);
    } catch (err) {
        next(new AppError('Failed to get active requests', 500));
    }
});

// Get active database queries
router.get('/queries', async (req, res, next) => {
    try {
        const queries = await getActiveQueries();
        res.json(queries);
    } catch (err) {
        next(new AppError('Failed to get active queries', 500));
    }
});

// Get error logs
router.get('/errors', async (req, res, next) => {
    try {
        const { startTime, endTime } = req.query;
        const errors = await getErrorLogs(startTime, endTime);
        res.json(errors);
    } catch (err) {
        next(new AppError('Failed to get error logs', 500));
    }
});

// Get performance report
router.get('/performance', async (req, res, next) => {
    try {
        const { startTime, endTime } = req.query;
        const report = await getPerformanceReport(startTime, endTime);
        res.json(report);
    } catch (err) {
        next(new AppError('Failed to get performance report', 500));
    }
});

module.exports = router; 