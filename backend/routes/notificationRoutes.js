const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/organizationMiddleware');

// All routes require authentication
router.use(protect);

// Notification routes
router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markNotificationAsRead);
router.put('/mark-all-read', notificationController.markAllNotificationsAsRead);
router.post('/send', protect, requireRole(['PLANNER_OWNER', 'PLANNER']), notificationController.sendNotification);
router.post('/request-access', protect, requireRole(['PLANNER_OWNER']), notificationController.requestAccess);

module.exports = router;
