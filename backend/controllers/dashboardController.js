const Event = require('../models/Event');
const Payment = require('../models/Payment');
const Client = require('../models/Client');
const Task = require('../models/Task');
const User = require('../models/User');

/**
 * Get comprehensive dashboard stats for PLANNER_OWNER
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    // Get metrics
    const [
      totalClients,
      activeEvents,
      pendingPaymentsData,
      teamMembers,
      tasks,
      revenueData
    ] = await Promise.all([
      // Total Clients
      Client.countDocuments({ organizationId, isActive: true }),

      // Active Events (Confirmed + In Progress)
      Event.countDocuments({
        organizationId,
        status: { $in: ['confirmed', 'in_progress'] }
      }),

      // Pending Payments
      Payment.aggregate([
        {
          $match: {
            organizationId,
            status: { $in: ['pending', 'partially_paid', 'overdue'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $subtract: ['$amount', '$paidAmount'] } },
            count: { $sum: 1 }
          }
        }
      ]),

      // Team Members
      User.countDocuments({ organizationId, isActive: true }),

      // Tasks
      Task.aggregate([
        { $match: { organizationId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Revenue by month (last 6 months)
      Payment.aggregate([
        {
          $match: {
            organizationId,
            status: 'paid',
            paidDate: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              month: { $month: '$paidDate' },
              year: { $year: '$paidDate' },
              type: '$paymentType'
            },
            total: { $sum: '$paidAmount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    // Format revenue chart data
    const revenueChart = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push({
        month: months[date.getMonth()],
        monthNum: date.getMonth() + 1,
        year: date.getFullYear(),
        client: 0,
        vendor: 0
      });
    }

    revenueData.forEach(item => {
      const monthData = last6Months.find(m => m.monthNum === item._id.month && m.year === item._id.year);
      if (monthData) {
        if (item._id.type === 'client_payment') {
          monthData.client = item.total;
        } else if (item._id.type === 'vendor_payment') {
          monthData.vendor = item.total;
        }
      }
    });

    // Events distribution
    const eventsData = await Promise.all([
      Event.aggregate([
        { $match: { organizationId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Event.aggregate([
        { $match: { organizationId } },
        { $group: { _id: '$eventType', count: { $sum: 1 } } }
      ])
    ]);

    const eventsByStatus = {};
    eventsData[0].forEach(item => {
      eventsByStatus[item._id] = item.count;
    });

    const eventsByType = {};
    eventsData[1].forEach(item => {
      eventsByType[item._id] = item.count;
    });

    // Payment status distribution
    const paymentDistribution = await Payment.aggregate([
      { $match: { organizationId } },
      {
        $group: {
          _id: '$status',
          // For paid: use paidAmount, for others: use remaining amount
          total: { 
            $sum: {
              $cond: [
                { $eq: ['$status', 'paid'] },
                '$paidAmount',
                { $subtract: ['$amount', '$paidAmount'] }
              ]
            }
          }
        }
      }
    ]);

    const paymentStatus = {
      paid: 0,
      pending: 0,
      overdue: 0
    };
    
    paymentDistribution.forEach(item => {
      if (item._id === 'paid') paymentStatus.paid = item.total;
      else if (item._id === 'pending' || item._id === 'partially_paid') paymentStatus.pending += item.total;
      else if (item._id === 'overdue') paymentStatus.overdue = item.total;
    });

    // Task distribution
    const taskDistribution = {
      todo: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0
    };
    
    tasks.forEach(item => {
      if (item._id) taskDistribution[item._id] = item.count;
    });

    // Recent activity (last 10 items)
    const recentEvents = await Event.find({
      organizationId,
      createdAt: { $gte: thirtyDaysAgo }
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('eventName status createdAt createdBy')
      .populate('createdBy', 'name')
      .lean();

    res.json({
      success: true,
      data: {
        metrics: {
          totalClients: { value: totalClients, change: '+5.2' },
          activeEvents: { value: activeEvents, change: '+12' },
          pendingPayments: {
            value: pendingPaymentsData[0]?.total || 0,
            count: pendingPaymentsData[0]?.count || 0,
            change: '-8.5'
          },
          teamMembers: { value: teamMembers, change: '+2' }
        },
        charts: {
          revenue: last6Months,
          events: {
            byStatus: eventsByStatus,
            byType: eventsByType
          },
          payments: paymentStatus,
          tasks: taskDistribution
        },
        recentActivity: recentEvents
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};
