const express = require('express');
const statisticsController = require('../controllers/statistics.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', verifyToken, statisticsController.getDashboardStats);

// Get detailed statistics
router.get('/detailed', verifyToken, statisticsController.getDetailedStats);

// Get yearly statistics
router.get('/yearly/:year', verifyToken, statisticsController.getYearlyStats);

// Save yearly statistics
router.post('/yearly', verifyToken, statisticsController.saveYearlyStats);

module.exports = router;