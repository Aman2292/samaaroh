const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/organizationMiddleware');

// All routes require authentication
router.use(protect);

// Team management routes (PLANNER_OWNER only)
router.post('/', requireRole(['PLANNER_OWNER']), teamController.createTeamMember);
router.get('/', requireRole(['PLANNER_OWNER', 'PLANNER']), teamController.getTeamMembers);
router.put('/:id', requireRole(['PLANNER_OWNER']), teamController.updateTeamMember);
router.delete('/:id', requireRole(['PLANNER_OWNER']), teamController.deactivateTeamMember);

// CSV import/export routes (PLANNER_OWNER and PLANNER)
router.post('/import-csv', requireRole(['PLANNER_OWNER', 'PLANNER']), teamController.importCSV);
router.get('/export-csv', requireRole(['PLANNER_OWNER', 'PLANNER']), teamController.exportCSV);
router.get('/csv-template', requireRole(['PLANNER_OWNER', 'PLANNER']), teamController.downloadCSVTemplate);

// Public invitation routes (no auth required)
router.get('/verify-invitation/:token', teamController.verifyInvitationToken);
router.post('/accept-invitation', teamController.acceptInvitation);

module.exports = router;
