const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

/**
 * @route   GET /api/activity-logs
 * @desc    Get activity logs with filters
 * @access  Private (PLANNER_OWNER only)
 */
const getActivityLogs = async (req, res, next) => {
  try {
    const { userId, action, resourceType, startDate, endDate, page = 1, limit = 50 } = req.query;

    // Build filter query
    const filter = { organizationId: req.user.organizationId };

    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (resourceType) filter.targetType = resourceType;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Get total count
    const total = await ActivityLog.countDocuments(filter);

    // Get paginated logs
    const logs = await ActivityLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/activity-logs/export
 * @desc    Export activity logs as CSV
 * @access  Private (PLANNER_OWNER only)
 */
const exportActivityLogs = async (req, res, next) => {
  try {
    const { userId, action, resourceType, startDate, endDate } = req.query;

    // Build filter query
    const filter = { organizationId: req.user.organizationId };

    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (resourceType) filter.targetType = resourceType;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Get all logs matching filter
    const logs = await ActivityLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .lean();

    // Convert to CSV
    const csvHeader = 'Timestamp,User,Role,Action,Resource Type,Resource Name,IP Address,Details\n';
    const csvRows = logs.map(log => {
      const timestamp = new Date(log.createdAt).toLocaleString('en-IN');
      const user = log.userId?.name || 'Unknown';
      const role = log.userId?.role || 'Unknown';
      const action = log.action ? log.action.replace(/_/g, ' ').toUpperCase() : 'N/A';
      const resourceType = log.targetType || 'N/A';
      const resourceName = log.targetName || 'N/A';
      const ipAddress = log.ipAddress || 'N/A';
      const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : 'N/A';

      return `"${timestamp}","${user}","${role}","${action}","${resourceType}","${resourceName}","${ipAddress}","${details}"`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=activity-logs-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivityLogs,
  exportActivityLogs
};
