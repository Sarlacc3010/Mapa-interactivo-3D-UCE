// Backend/src/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const verifyToken = require('../middlewares/authMiddleware');

// Todas estas rutas requieren estar logueado (verifyToken)
router.get('/summary', verifyToken, analyticsController.getSummary);
router.get('/top-locations', verifyToken, analyticsController.getTopLocations);
router.get('/peak-hours', verifyToken, analyticsController.getPeakHours);

module.exports = router;