const Organization = require('../models/Organization');
const User = require('../models/User');
const Event = require('../models/Event');
const Client = require('../models/Client');

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

module.exports = {
  getSystemStats
};
