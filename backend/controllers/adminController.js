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

/**
 * @route   GET /api/admin/organizations
 * @desc    Get all organizations
 * @access  Private (SUPER_ADMIN only)
 */
const getAllOrganizations = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const result = await adminService.getAllOrganizations({ page, limit, search });

    res.json({
      success: true,
      data: result.organizations,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/organizations/:id
 * @desc    Get organization details
 * @access  Private (SUPER_ADMIN only)
 */
const getOrganizationDetails = async (req, res, next) => {
  try {
    const organization = await adminService.getOrganizationDetails(req.params.id);

    res.json({
      success: true,
      data: organization
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/organizations/:id/suspend
 * @desc    Suspend organization
 * @access  Private (SUPER_ADMIN only)
 */
const suspendOrganization = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    
    const organization = await adminService.suspendOrganization(
      req.params.id,
      reason,
      req.user._id,
      ipAddress,
      userAgent
    );

    res.json({
      success: true,
      data: organization,
      message: 'Organization suspended successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/organizations/:id/unsuspend
 * @desc    Unsuspend organization
 * @access  Private (SUPER_ADMIN only)
 */
const unsuspendOrganization = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    
    const organization = await adminService.unsuspendOrganization(
      req.params.id,
      req.user._id,
      ipAddress,
      userAgent
    );

    res.json({
      success: true,
      data: organization,
      message: 'Organization unsuspended successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/organizations/:id/features
 * @desc    Update organization subscribed features
 * @access  Private (SUPER_ADMIN only)
 */
const updateOrganizationFeatures = async (req, res, next) => {
  try {
    const { features } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    
    const organization = await adminService.updateOrganizationFeatures(
      req.params.id,
      features,
      req.user._id,
      ipAddress,
      userAgent
    );

    res.json({
      success: true,
      data: organization,
      message: 'Organization features updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/admin/organizations/:id
 * @desc    Delete organization (soft delete)
 * @access  Private (SUPER_ADMIN only)
 */
const deleteOrganization = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    
    await adminService.deleteOrganization(
      req.params.id,
      req.user._id,
      ipAddress,
      userAgent
    );

    res.json({
      success: true,
      message: 'Organization deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/organizations/:id/users
 * @desc    Get organization users
 * @access  Private (SUPER_ADMIN only)
 */
const getOrganizationUsers = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await adminService.getOrganizationUsers(req.params.id, { page, limit });

    res.json({
      success: true,
      data: result.users,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/organizations/:id/events
 * @desc    Get organization events
 * @access  Private (SUPER_ADMIN only)
 */
const getOrganizationEvents = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await adminService.getOrganizationEvents(req.params.id, { page, limit });

    res.json({
      success: true,
      data: result.events,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Private (SUPER_ADMIN only)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, search, organizationId, role, status } = req.query;
    const result = await adminService.getAllUsers({ page, limit, search, organizationId, role, status });

    res.json({
      success: true,
      data: result.users,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user details
 * @access  Private (SUPER_ADMIN only)
 */
const getUserDetails = async (req, res, next) => {
  try {
    const user = await adminService.getUserDetails(req.params.id);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/users/:id/deactivate
 * @desc    Deactivate user
 * @access  Private (SUPER_ADMIN only)
 */
const deactivateUser = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    
    await adminService.deactivateUser(
      req.params.id,
      req.user._id,
      ipAddress,
      userAgent
    );

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/users/:id/activate
 * @desc    Activate (Unblock) user
 * @access  Private (SUPER_ADMIN only)
 */
const activateUser = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    
    await adminService.activateUser(
      req.params.id,
      req.user._id,
      ipAddress,
      userAgent
    );

    res.json({
      success: true,
      message: 'User activated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/users/:id/reset-password
 * @desc    Reset user password
 * @access  Private (SUPER_ADMIN only)
 */
const resetUserPassword = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    
    const result = await adminService.resetUserPassword(
      req.params.id,
      req.user._id,
      ipAddress,
      userAgent
    );

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/users/:id/activity
 * @desc    Get user activity logs
 * @access  Private (SUPER_ADMIN only)
 */
const getUserActivityLogs = async (req, res, next) => {
  try {
    const logs = await adminService.getUserActivityLogs(req.params.id);

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/organizations/:id/activity
 * @desc    Get organization activity logs
 * @access  Private (SUPER_ADMIN only)
 */
const getOrganizationActivityLogs = async (req, res, next) => {
  try {
    const logs = await adminService.getOrganizationActivityLogs(req.params.id);

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSystemStats,
  getAllOrganizations,
  getOrganizationDetails,
  suspendOrganization,
  unsuspendOrganization,
  deleteOrganization,
  getOrganizationUsers,
  getOrganizationEvents,
  getAllUsers,
  getUserDetails,
  deactivateUser,
  updateOrganizationFeatures,
  activateUser,
  resetUserPassword,
  getUserActivityLogs,
  getOrganizationActivityLogs
};
