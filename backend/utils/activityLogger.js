const ActivityLog = require('../models/ActivityLog');

/**
 * Log an admin action for audit trail
 */
const logActivity = async (userId, userRole, action, targetType, targetId, targetName, details, ipAddress, userAgent, organizationId) => {
  try {
    await ActivityLog.create({
      userId,
      userRole,
      action,
      targetType,
      targetId,
      targetName,
      details,
      ipAddress,
      userAgent,
      organizationId
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - logging failure shouldn't break the main operation
  }
};

/**
 * Get user activity logs
 */
const getUserActivityLogs = async (userId, limit = 20) => {
  const logs = await ActivityLog.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  
  return logs;
};

/**
 * Get organization activity logs
 */
const getOrganizationActivityLogs = async (organizationId, limit = 50) => {
  const logs = await ActivityLog.find({ organizationId })
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  
  return logs;
};

module.exports = {
  logActivity,
  getUserActivityLogs,
  getOrganizationActivityLogs
};
