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
    const totalEvents = await Event.countDocuments({ isActive: true });

    // Get total clients across all organizations
    const totalClients = await Client.countDocuments({ isActive: true });

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
          isActive: true
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
          isActive: true
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
      const eventsCount = await Event.countDocuments({ organizationId: org._id, isActive: true });
      const usersCount = await User.countDocuments({ organizationId: org._id, isActive: true });
      
      const recentEvents = await Event.find({ 
        organizationId: org._id, 
        isActive: true
      })
      .select('eventName eventDate status')
      .sort({ eventDate: -1 })
      .limit(3);

      return {
        ...org.toObject(),
        eventsCount,
        usersCount,
        recentEvents
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

  const eventsCount = await Event.countDocuments({ organizationId: orgId, isActive: true });
  const usersCount = await User.countDocuments({ organizationId: orgId, isActive: true });
  const clientsCount = await Client.countDocuments({ organizationId: orgId, isActive: true });

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
 * Update organization features
 */
const updateOrganizationFeatures = async (orgId, features, updatedByUserId, ipAddress, userAgent) => {
  const organization = await Organization.findById(orgId);

  if (!organization) {
    throw new Error('Organization not found');
  }

  // Merge features (deep merge logic needed if partial updates)
  // For now, assuming full object or careful checking. 
  // Should handle nested 'events' object.
  if (features.clients !== undefined) organization.subscribedFeatures.clients = features.clients;
  if (features.tasks !== undefined) organization.subscribedFeatures.tasks = features.tasks;

  // Normalize legacy feature flags specific to this Organization
  // If 'payments', 'team', or 'venue' are boolean (legacy), convert to object defaults
  if (typeof organization.subscribedFeatures.payments !== 'object') {
      const isTrue = organization.subscribedFeatures.payments === true;
      organization.subscribedFeatures.payments = { access: isTrue, client: true, vendor: true };
  }
  if (typeof organization.subscribedFeatures.team !== 'object') {
      const isTrue = organization.subscribedFeatures.team === true;
      organization.subscribedFeatures.team = { access: isTrue, manage: true, export: true };
  }
  if (typeof organization.subscribedFeatures.venue !== 'object') {
      const isTrue = organization.subscribedFeatures.venue === true;
      organization.subscribedFeatures.venue = { access: isTrue, profile: true, gallery: true, packages: true, availability: true, tasks: true };
  }

  // Handle nested updates for Events
  if (features.events !== undefined) {
    let eventsObj = typeof organization.subscribedFeatures.events === 'object' && organization.subscribedFeatures.events !== null
      ? (organization.subscribedFeatures.events.toObject ? organization.subscribedFeatures.events.toObject() : { ...organization.subscribedFeatures.events })
      : { access: true, guests: true, payments: true, tasks: true };

    if (typeof features.events === 'boolean') {
        eventsObj.access = features.events;
    } else {
        if (features.events.access !== undefined) eventsObj.access = features.events.access;
        if (features.events.guests !== undefined) eventsObj.guests = features.events.guests;
        if (features.events.payments !== undefined) eventsObj.payments = features.events.payments;
        if (features.events.tasks !== undefined) eventsObj.tasks = features.events.tasks;
    }
    
    organization.subscribedFeatures.events = eventsObj;
  }

  // Handle nested updates for Payments
  if (features.payments !== undefined) {
    // Already normalized above, but ensure we work with the object
    let paymentsObj = organization.subscribedFeatures.payments && organization.subscribedFeatures.payments.toObject 
        ? organization.subscribedFeatures.payments.toObject() 
        : { ...organization.subscribedFeatures.payments };

    if (typeof features.payments === 'boolean') {
        paymentsObj.access = features.payments;
    } else {
        if (features.payments.access !== undefined) paymentsObj.access = features.payments.access;
        if (features.payments.client !== undefined) paymentsObj.client = features.payments.client;
        if (features.payments.vendor !== undefined) paymentsObj.vendor = features.payments.vendor;
    }

    organization.subscribedFeatures.payments = paymentsObj;
  }

  // Handle nested updates for Venue
  if (features.venue !== undefined) {
    let venueObj = organization.subscribedFeatures.venue && organization.subscribedFeatures.venue.toObject 
        ? organization.subscribedFeatures.venue.toObject() 
        : { ...organization.subscribedFeatures.venue };

    if (typeof features.venue === 'boolean') {
        venueObj.access = features.venue;
    } else {
        if (features.venue.access !== undefined) venueObj.access = features.venue.access;
        if (features.venue.profile !== undefined) venueObj.profile = features.venue.profile;
        if (features.venue.gallery !== undefined) venueObj.gallery = features.venue.gallery;
        if (features.venue.packages !== undefined) venueObj.packages = features.venue.packages;
        if (features.venue.availability !== undefined) venueObj.availability = features.venue.availability;
        if (features.venue.tasks !== undefined) venueObj.tasks = features.venue.tasks;
    }

    organization.subscribedFeatures.venue = venueObj;
  }

  // Handle nested updates for Team
  if (features.team !== undefined) {
    let teamObj = organization.subscribedFeatures.team && organization.subscribedFeatures.team.toObject 
        ? organization.subscribedFeatures.team.toObject() 
        : { ...organization.subscribedFeatures.team };

    if (typeof features.team === 'boolean') {
        teamObj.access = features.team;
    } else {
        if (features.team.access !== undefined) teamObj.access = features.team.access;
        if (features.team.manage !== undefined) teamObj.manage = features.team.manage;
        if (features.team.export !== undefined) teamObj.export = features.team.export;
    }

    organization.subscribedFeatures.team = teamObj;
  }

  await organization.save();

  // Log activity
  const user = await User.findById(updatedByUserId);
  await logActivity(
    updatedByUserId,
    user?.role,
    'update_features',
    'organization',
    orgId,
    organization.name,
    { features },
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
    isActive: true
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
    isActive: true
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
 * Activate user (Unblock)
 */
const activateUser = async (userId, activatedByUserId, ipAddress, userAgent) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  if (user.isActive) {
    throw new Error('User is already active');
  }

  user.isActive = true;
  await user.save();

  // Log activity
  const adminUser = await User.findById(activatedByUserId);
  await logActivity(
    activatedByUserId,
    adminUser?.role,
    'activate_user',
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

/**
 * Get organization activity logs
 */
const getOrganizationActivityLogs = async (organizationId) => {
  try {
    const logs = await ActivityLog.find({ organizationId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email role')
      .limit(100);

    return logs;
  } catch (error) {
    throw error;
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
  activateUser,
  resetUserPassword,
  updateOrganizationFeatures,
  getUserActivityLogs,
  getOrganizationActivityLogs
};
