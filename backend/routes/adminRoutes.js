const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/organizationMiddleware');

// All routes require authentication and SUPER_ADMIN role
router.use(protect);
router.use(requireRole(['SUPER_ADMIN']));

// System stats
router.get('/stats', adminController.getSystemStats);

// Organizations management
router.get('/organizations', adminController.getAllOrganizations);
router.get('/organizations/:id', adminController.getOrganizationDetails);
router.put('/organizations/:id/suspend', adminController.suspendOrganization);
router.put('/organizations/:id/unsuspend', adminController.unsuspendOrganization);
router.delete('/organizations/:id', adminController.deleteOrganization);
router.get('/organizations/:id/users', adminController.getOrganizationUsers);
router.get('/organizations/:id/events', adminController.getOrganizationEvents);
router.get('/organizations/:id/activity', adminController.getOrganizationActivityLogs);

// Users management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserDetails);
router.get('/users/:id/activity', adminController.getUserActivityLogs);
router.put('/users/:id/deactivate', adminController.deactivateUser);
router.put('/users/:id/activate', adminController.activateUser);
router.post('/users/:id/reset-password', adminController.resetUserPassword);

router.put('/organizations/:id/features', adminController.updateOrganizationFeatures);

module.exports = router;
