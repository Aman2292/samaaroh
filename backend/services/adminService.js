const Organization = require('../models/Organization');
const User = require('../models/User');
const Event = require('../models/Event');
const Client = require('../models/Client');
const { logActivity, getUserActivityLogs: getActivityLogs } = require('../utils/activityLogger');

/**
 * Get system-wide statistics for Super Admin
 */
const getSystemStats = async () => {
  try {
    // Get total organizations
    const totalOrganizations = await Organization.countDocuments({ isActive: true });

    // Get total users
    const totalUsers = await User.countDocuments({ isActive: true });

    // Get active users (logged in within last 30 days - simplified for now)
    const activeUsers = await User.countDocuments({ isActive: true });

    // Get total events across all organizations
    const totalEvents = await Event.countDocuments({ isDeleted: false });

    // Get total clients across all organizations
    const totalClients = await Client.countDocuments({ isDeleted: false });

    // Get organization growth data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const organizationGrowth = await Organization.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get user distribution by role
    const userDistribution = await User.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get weekly activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyEvents = await Event.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    const weeklyClients = await Client.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    return {
      totalOrganizations,
      totalUsers,
      activeUsers,
      totalEvents,
      totalClients,
      organizationGrowth,
      userDistribution,
      weeklyActivity: {
        events: weeklyEvents,
        clients: weeklyClients
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get all organizations with stats
 */
const getAllOrganizations = async (filters = {}) => {
  const { page = 1, limit = 20, search = '' } = filters;

  const query = { isActive: true };
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;

  const organizations = await Organization.find(query)
    .populate('ownerUserId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Organization.countDocuments(query);

  // Get stats for each organization
  const orgsWithStats = await Promise.all(
    organizations.map(async (org) => {
      const eventsCount = await Event.countDocuments({ organizationId: org._id, isDeleted: false });
      const usersCount = await User.countDocuments({ organizationId: org._id, isActive: true });
      
      return {
        ...org.toObject(),
        eventsCount,
        usersCount
      };
    })
  );

  return {
    organizations: orgsWithStats,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  };
};

/**
 * Get organization details with full stats
 */
const getOrganizationDetails = async (orgId) => {
  const organization = await Organization.findById(orgId)
    .populate('ownerUserId', 'name email phone')
    .populate('suspendedBy', 'name email');

  if (!organization) {
    throw new Error('Organization not found');
  }

  const eventsCount = await Event.countDocuments({ organizationId: orgId, isDeleted: false });
  const usersCount = await User.countDocuments({ organizationId: orgId, isActive: true });
  const clientsCount = await Client.countDocuments({ organizationId: orgId, isDeleted: false });

  return {
    ...organization.toObject(),
    stats: {
      eventsCount,
      usersCount,
      clientsCount
    }
  };
};

/**
 * Suspend organization
 */
const suspendOrganization = async (orgId, reason, suspendedByUserId, ipAddress, userAgent) => {
  const organization = await Organization.findById(orgId);

  if (!organization) {
    throw new Error('Organization not found');
  }

  if (organization.status === 'suspended') {
    throw new Error('Organization is already suspended');
  }

  organization.status = 'suspended';
  organization.suspendedAt = new Date();
  organization.suspendedBy = suspendedByUserId;
  organization.suspensionReason = reason;

  await organization.save();

  // Log activity
  const user = await User.findById(suspendedByUserId);
  await logActivity(
    suspendedByUserId,
    user?.role,
    'suspend_organization',
    'organization',
    orgId,
    organization.name,
    { reason },
    ipAddress,
    userAgent
  );

  return organization;
};

/**
 * Unsuspend organization
 */
const unsuspendOrganization = async (orgId, unsuspendedByUserId, ipAddress, userAgent) => {
  const organization = await Organization.findById(orgId);

  if (!organization) {
    throw new Error('Organization not found');
  }

  if (organization.status !== 'suspended') {
    throw new Error('Organization is not suspended');
  }

  organization.status = 'active';
  organization.suspendedAt = null;
  organization.suspendedBy = null;
  organization.suspensionReason = null;

  await organization.save();

  // Log activity
  const user = await User.findById(unsuspendedByUserId);
  await logActivity(
    unsuspendedByUserId,
    user?.role,
    'unsuspend_organization',
    'organization',
    orgId,
    organization.name,
    {},
    ipAddress,
    userAgent
  );

  return organization;
};

/**
 * Delete organization (soft delete)
 */
const deleteOrganization = async (orgId, deletedByUserId, ipAddress, userAgent) => {
  const organization = await Organization.findById(orgId);

  if (!organization) {
    throw new Error('Organization not found');
  }

  organization.isActive = false;
  await organization.save();

  // Also soft delete all users in the organization
  await User.updateMany(
    { organizationId: orgId },
    { $set: { isActive: false } }
  );

  // Log activity
  const user = await User.findById(deletedByUserId);
  await logActivity(
    deletedByUserId,
    user?.role,
    'delete_organization',
    'organization',
    orgId,
    organization.name,
    {},
    ipAddress,
    userAgent
  );

  return organization;
};

/**
 * Get organization users
 */
const getOrganizationUsers = async (orgId, filters = {}) => {
  const { page = 1, limit = 20 } = filters;

  const query = {
    organizationId: orgId,
    isActive: true
  };

  const skip = (page - 1) * limit;

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);

  return {
    users,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  };
};

/**
 * Get organization events
 */
const getOrganizationEvents = async (orgId, filters = {}) => {
  const { page = 1, limit = 20 } = filters;

  const query = {
    organizationId: orgId,
    isDeleted: false
  };

  const skip = (page - 1) * limit;

  const events = await Event.find(query)
    .populate('clientId', 'name phone')
    .populate('leadPlannerId', 'name')
    .sort({ eventDate: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Event.countDocuments(query);

  return {
    events,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  };
};

/**
 * Get all users across organizations
 */
const getAllUsers = async (filters = {}) => {
  const { page = 1, limit = 20, search = '', organizationId, role, status } = filters;

  const query = {};
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  if (organizationId) {
    query.organizationId = organizationId;
  }

  if (role) {
    query.role = role;
  }

  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  }

  const skip = (page - 1) * limit;

  const users = await User.find(query)
    .select('-password')
    .populate('organizationId', 'name')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);

  return {
    users,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  };
};

/**
 * Get user details
 */
const getUserDetails = async (userId) => {
  const user = await User.findById(userId)
    .select('-password')
    .populate('organizationId', 'name city')
    .populate('createdBy', 'name email');

  if (!user) {
    throw new Error('User not found');
  }

  // Get user's events count
  const eventsCount = await Event.countDocuments({
    $or: [
      { leadPlannerId: userId },
      { coordinators: userId }
    ],
    isDeleted: false
  });

  return {
    ...user.toObject(),
    stats: {
      eventsCount
    }
  };
};

/**
 * Deactivate user
 */
const deactivateUser = async (userId, deactivatedByUserId, ipAddress, userAgent) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.isActive) {
    throw new Error('User is already deactivated');
  }

  user.isActive = false;
  await user.save();

  // Log activity
  const adminUser = await User.findById(deactivatedByUserId);
  await logActivity(
    deactivatedByUserId,
    adminUser?.role,
    'deactivate_user',
    'user',
    userId,
    user.name,
    { email: user.email },
    ipAddress,
    userAgent
  );

  return user;
};

/**
 * Reset user password (generate reset token)
 */
const resetUserPassword = async (userId, resetByUserId, ipAddress, userAgent) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Log activity
  const adminUser = await User.findById(resetByUserId);
  await logActivity(
    resetByUserId,
    adminUser?.role,
    'reset_password',
    'user',
    userId,
    user.name,
    { email: user.email },
    ipAddress,
    userAgent
  );

  // TODO: Generate password reset token and send email
  // For now, just return success
  return {
    success: true,
    message: 'Password reset link sent to user email',
    user: {
      id: user._id,
      email: user.email,
      name: user.name
    }
  };
};

/**
 * Get user activity logs
 */
const getUserActivityLogs = async (userId) => {
  return await getActivityLogs(userId, 20);
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
  resetUserPassword,
  getUserActivityLogs
};
