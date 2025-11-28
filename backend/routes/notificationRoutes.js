const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Notification routes
router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markNotificationAsRead);
router.put('/mark-all-read', notificationController.markAllNotificationsAsRead);
router.post('/send', notificationController.sendNotification);

module.exports = router;
