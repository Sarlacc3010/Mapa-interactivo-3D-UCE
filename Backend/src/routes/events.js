const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
// Import controller
const eventsController = require('../controllers/eventsController');

// Public Routes (Read)
router.get('/', eventsController.getEvents);
router.get('/location/:id', eventsController.getEventsByLocation);
router.get('/:id', eventsController.getEventById);

// Protected Routes (Write - Admin)
router.post('/', authMiddleware, eventsController.createEvent);
router.put('/:id', authMiddleware, eventsController.updateEvent);
router.delete('/:id', authMiddleware, eventsController.deleteEvent);

module.exports = router;