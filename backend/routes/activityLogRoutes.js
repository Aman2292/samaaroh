const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/organizationMiddleware');

// All routes require authentication and PLANNER_OWNER role
router.use(protect);
router.use(requireRole(['PLANNER_OWNER']));

// Activity logs routes
router.get('/', activityLogController.getActivityLogs);
router.get('/export', activityLogController.exportActivityLogs);

module.exports = router;
