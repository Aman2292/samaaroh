const adminService = require('../services/adminService');

/**
 * @route   GET /api/admin/stats
 * @desc    Get system-wide statistics (SUPER_ADMIN only)
 * @access  Private
 */
const getSystemStats = async (req, res, next) => {
  try {
    // Only SUPER_ADMIN can access
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Super Admin only.'
      });
    }

    const stats = await adminService.getSystemStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSystemStats
};
