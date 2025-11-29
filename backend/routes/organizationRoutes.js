const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const organizationSettingsController = require('../controllers/organizationSettingsController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/organizationMiddleware');

// All routes require authentication
router.use(protect);

// Task status settings (PLANNER_OWNER and PLANNER can view)
router.get('/settings/task-statuses', organizationSettingsController.getTaskStatuses);

// Task status management (PLANNER_OWNER and PLANNER can manage)
router.put('/settings/task-statuses', restrictTo('PLANNER_OWNER', 'PLANNER'), organizationSettingsController.updateTaskStatuses);
router.post('/settings/task-statuses', restrictTo('PLANNER_OWNER', 'PLANNER'), organizationSettingsController.addTaskStatus);
router.delete('/settings/task-statuses/:value', restrictTo('PLANNER_OWNER', 'PLANNER'), organizationSettingsController.deleteTaskStatus);

// Reset to defaults (PLANNER_OWNER only)
router.post('/settings/reset-task-statuses', restrictTo('PLANNER_OWNER'), organizationSettingsController.resetTaskStatuses);

// Organization settings (PLANNER_OWNER only)
router.use(requireRole(['PLANNER_OWNER']));
router.put('/settings', organizationController.updateSettings);
router.post('/transfer-ownership', organizationController.transferOwnership);
router.delete('/', organizationController.deleteOrganization);

module.exports = router;
