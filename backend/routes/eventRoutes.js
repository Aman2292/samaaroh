const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { scopeToOrganization, verifyOwnership, applyRolePermissions } = require('../middleware/organizationMiddleware');
const { validateEvent, validateEventUpdate } = require('../validators/eventValidator');
const Event = require('../models/Event');

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
router.delete('/:id', verifyOwnership(Event), eventController.deleteEvent);

module.exports = router;
