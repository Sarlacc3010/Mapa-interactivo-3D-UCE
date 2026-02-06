const express = require('express');
const router = express.Router();
const { generateLogsReport } = require('../controllers/reportsController');
const analyticsController = require('../controllers/analyticsController');
const verifyToken = require('../middlewares/authMiddleware'); // Imported as "verifyToken"

// All these routes require login (verifyToken)
router.get('/summary', verifyToken, analyticsController.getSummary);
router.get('/top-locations', verifyToken, analyticsController.getTopLocations);
router.get('/peak-hours', verifyToken, analyticsController.getPeakHours);

// Use "verifyToken" instead of "authMiddleware"
router.get('/report/pdf', verifyToken, generateLogsReport);

module.exports = router;