const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

router.post('/', teamController.createTeamMember);
router.get('/', teamController.getTeamMembers);
router.put('/:id', teamController.updateTeamMember);
router.delete('/:id', teamController.deactivateTeamMember);

module.exports = router;
