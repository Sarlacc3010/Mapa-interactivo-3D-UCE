const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const locationsController = require('../controllers/locationsController');

// ==========================================
// RUTAS PÚBLICAS
// ==========================================
router.get('/', locationsController.getLocations);
router.post('/:id/visit', locationsController.registerVisit);

// ==========================================
// RUTAS ADMIN (PROTEGIDAS)
// ==========================================
router.post('/', verifyToken, locationsController.createLocation);
router.put('/:id', verifyToken, locationsController.updateLocation);
router.delete('/:id', verifyToken, locationsController.deleteLocation);

module.exports = router;
