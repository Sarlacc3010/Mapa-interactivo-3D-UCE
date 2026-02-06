const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const locationsController = require('../controllers/locationsController');

// ==========================================
// PUBLIC ROUTES
// ==========================================
router.get('/', locationsController.getLocations);
router.post('/:id/visit', locationsController.registerVisit);

// ==========================================
// ADMIN ROUTES (PROTECTED)
// ==========================================
router.post('/', verifyToken, locationsController.createLocation);
router.put('/:id', verifyToken, locationsController.updateLocation);
router.delete('/:id', verifyToken, locationsController.deleteLocation);

module.exports = router;
