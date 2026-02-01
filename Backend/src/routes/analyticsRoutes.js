const express = require('express');
const router = express.Router();
const { generateLogsReport } = require('../controllers/reportsController'); 
const analyticsController = require('../controllers/analyticsController');
const verifyToken = require('../middlewares/authMiddleware'); // Se importa como "verifyToken"

// Todas estas rutas requieren estar logueado (verifyToken)
router.get('/summary', verifyToken, analyticsController.getSummary);
router.get('/top-locations', verifyToken, analyticsController.getTopLocations);
router.get('/peak-hours', verifyToken, analyticsController.getPeakHours);

// CORRECCIÓN AQUÍ: Usar "verifyToken" en lugar de "authMiddleware"
router.get('/report/pdf', verifyToken, generateLogsReport);

module.exports = router;