const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');
const verifyToken = require('../middlewares/authMiddleware'); // Asegúrate de tener este archivo movido también

// Rutas Públicas
router.get('/', eventsController.getEvents);

// Rutas Protegidas (Solo Admin/Usuarios registrados)
router.post('/', verifyToken, eventsController.createEvent);
router.put('/:id', verifyToken, eventsController.updateEvent);
router.delete('/:id', verifyToken, eventsController.deleteEvent);

module.exports = router;