const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { scopeToOrganization, verifyOwnership, applyRolePermissions } = require('../middleware/organizationMiddleware');
const { validateEvent, validateEventUpdate } = require('../validators/eventValidator');
const Event = require('../models/Event');
const guestRoutes = require('./guestRoutes');
const eventTaskRoutes = require('./eventTaskRoutes');

// Apply authentication and organization scoping to all routes
router.use(protect);
router.use(scopeToOrganization);

// Routes with role-based permissions
router.post('/', validateEvent, eventController.createEvent);
router.get('/', applyRolePermissions, eventController.getEvents);
router.get('/upcoming', applyRolePermissions, eventController.getUpcomingEvents);
router.get('/stats', applyRolePermissions, eventController.getEventStats);
router.get('/:id', verifyOwnership(Event), eventController.getEvent);
router.put('/:id', verifyOwnership(Event), validateEventUpdate, eventController.updateEvent);

// Nested guest routes - /api/events/:eventId/guests
router.use('/:eventId/guests', guestRoutes);

// Nested task routes - /api/events/:eventId/tasks
router.use('/:eventId/tasks', eventTaskRoutes);

router.delete('/:id', verifyOwnership(Event), eventController.deleteEvent);

module.exports = router;
