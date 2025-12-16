const notificationService = require('../services/notificationService');

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @access  Private
 */
const getNotifications = async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    
    const result = await notificationService.getUserNotifications(req.user._id, parseInt(limit));

    res.json({
      success: true,
      data: result.notifications,
      unreadCount: result.unreadCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
const markNotificationAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    if (error.message === 'Notification not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
};

/**
 * @route   PUT /api/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Private
 */
const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user._id);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/notifications/send
 * @desc    Send manual notification
 * @access  Private (Planner Owner, Planner)
 */
const sendNotification = async (req, res, next) => {
  try {
    const { title, message, link, taggedUserIds } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Title and message are required'
      });
    }

    const result = await notificationService.sendManualNotification(
      req.user,
      title,
      message,
      link,
      taggedUserIds
    );

    res.json({
      success: true,
      message: `Notification sent to ${result.count} recipients`,
      count: result.count
    });
  } catch (error) {
    if (error.message === 'You do not have permission to send notifications') {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
};

/**
 * @route   POST /api/notifications/request-access
 * @desc    Request access to a feature
 * @access  Private (Planner Owner)
 */
const requestAccess = async (req, res, next) => {
  try {
    const { featureName } = req.body;

    if (!featureName) {
      return res.status(400).json({
        success: false,
        error: 'Feature name is required'
      });
    }

    // Populate organization name for the message if not already present
    // req.user usually has organizationId as an ID string unless populated middleware runs.
    // Let's assume userController.protect populates basic fields or we rely on just ID if name is missing.
    // For better UX, we might want to ensure we have the Org name.
    // But since this is just a quick request, relying on what's in req.user is faster.
    
    await notificationService.sendAccessRequest(req.user, featureName);

    res.json({
      success: true,
      message: 'Access request sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  sendNotification,
  requestAccess
};
