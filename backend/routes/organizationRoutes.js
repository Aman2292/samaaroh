const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/organizationMiddleware');

// All routes require authentication and PLANNER_OWNER role
router.use(protect);
router.use(requireRole(['PLANNER_OWNER']));

// Organization settings
router.put('/settings', organizationController.updateSettings);
router.post('/transfer-ownership', organizationController.transferOwnership);
router.delete('/', organizationController.deleteOrganization);

module.exports = router;
