const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getDashboardStats } = require('../controllers/dashboardController');

// @route   GET /api/dashboard/stats
// @desc    Get comprehensive dashboard statistics
// @access  Private (PLANNER_OWNER, PLANNER, FINANCE)
router.get('/stats', protect, getDashboardStats);

module.exports = router;
