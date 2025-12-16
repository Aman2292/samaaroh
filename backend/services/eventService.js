const mongoose = require('mongoose');
const Event = require('../models/Event');
const Client = require('../models/Client');
const Payment = require('../models/Payment');
const { startOfDay, endOfDay, addDays } = require('date-fns');

/**
 * Create a new event
 * @param {Object} eventData 
 * @returns {Promise<Event>}
 */
const createEvent = async (eventData) => {
  const event = new Event(eventData);
  await event.save();
  return event;
};

/**
 * Get events with pagination and filtering
 * @param {String} organizationId
 * @param {Object} filter - MongoDB filter object
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} - Paginated result
 */
const getEvents = async (organizationId, filter, options) => {
  const { page = 1, limit = 10, sort = { eventDate: 1 } } = options;
  
  // Ensure we only get active events unless specified otherwise
  const query = { isActive: true, ...filter };
  
  if (organizationId) {
      query.organizationId = organizationId;
  }

  return await Event.paginate(query, {
    page,
    limit,
    sort,
    populate: [
      { path: 'clientId', select: 'name email phone' },
      { path: 'leadPlannerId', select: 'name email' },
      { path: 'venueId', select: 'name address' }
    ]
  });
};

/**
 * Get upcoming events for an organization
 * @param {String} organizationId 
 * @param {Object} filters
 * @returns {Promise<Array>}
 */
const getUpcomingEvents = async (organizationId, filters = {}) => {
  const today = startOfDay(new Date());
  const nextWeek = endOfDay(addDays(today, 7));
  
  const query = {
    organizationId,
    isActive: true,
    eventDate: { $gte: today, $lte: nextWeek },
    status: { $in: ['booked', 'in_progress'] },
    ...filters
  };

  return await Event.find(query)
    .sort({ eventDate: 1 })
    .populate('clientId', 'name')
    .populate('venueId', 'name');
};

/**
 * Get event by ID
 * @param {String} eventId 
 * @returns {Promise<Event>}
 */
const getEventById = async (eventId) => {
  return await Event.findOne({ _id: eventId, isActive: true })
    .populate('clientId')
    .populate('leadPlannerId', 'name email')
    .populate('assignedCoordinators', 'name email')
    .populate('venueId')
    .populate('guests.addedBy', 'name');
};

/**
 * Update active event
 * @param {String} eventId 
 * @param {Object} updateData 
 * @param {String} userId
 * @param {String} userRole
 * @returns {Promise<Event>}
 */
const updateEvent = async (eventId, updateData, userId, userRole) => {
  return await Event.findOneAndUpdate(
    { _id: eventId, isActive: true },
    updateData,
    { new: true, runValidators: true }
  );
};

/**
 * Soft delete event
 * @param {String} eventId 
 * @returns {Promise<Event>}
 */
const deleteEvent = async (eventId) => {
  return await Event.findByIdAndUpdate(
    eventId,
    { isActive: false, status: 'cancelled' },
    { new: true }
  );
};

/**
 * Get event statistics for dashboard
 */
const getEventStats = async (organizationId, filters) => {
  const today = startOfDay(new Date());
  const nextWeek = endOfDay(addDays(today, 7));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const baseQuery = { isActive: true };
  
  // If organizationId is provided (not SUPER_ADMIN), filter by it
  if (organizationId) {
    baseQuery.organizationId = organizationId;
  }
  
  Object.assign(baseQuery, filters);

  const [upcomingCount, monthCount] = await Promise.all([
    Event.countDocuments({
      ...baseQuery,
      eventDate: { $gte: today, $lte: nextWeek },
      status: { $in: ['booked', 'in_progress'] }
    }),
    Event.countDocuments({
      ...baseQuery,
      eventDate: { $gte: startOfMonth, $lte: endOfMonth }
    })
  ]);

  // --- Smart Analytics: Risky Events & Cash Stuck ---

  // 1. Cash Stuck: Total calculated overdue amount
  // (Using simple match: dueDate < now AND status != paid)
  let cashStuck = 0;
  if (organizationId) {
      const cashResult = await Payment.aggregate([
          {
              $match: {
                  organizationId: new mongoose.Types.ObjectId(organizationId),
                  dueDate: { $lt: new Date() },
                  status: { $ne: 'paid' },
                  isDeleted: false
              }
          },
          {
              $group: {
                  _id: null,
                  total: { $sum: { $subtract: ["$amount", "$paidAmount"] } } 
              }
          }
      ]);
      cashStuck = cashResult[0]?.total || 0;
  }

  // 2. Risky Events: Upcoming events (next 7 days) having ANY overdue payments
  let riskyEvents = 0;
  if (organizationId) {
      // Get IDs of upcoming events first
      const upcomingEventDocs = await Event.find({
          ...baseQuery,
          eventDate: { $gte: today, $lte: nextWeek },
          status: { $in: ['booked', 'in_progress'] }
      }).select('_id');
      
      const upcomingIds = upcomingEventDocs.map(e => e._id);

      if (upcomingIds.length > 0) {
          // Count how many of these have at least one overdue payment
          const result = await Payment.distinct('eventId', {
              organizationId: organizationId,
              eventId: { $in: upcomingIds },
              dueDate: { $lt: new Date() },
              status: { $ne: 'paid' },
              isDeleted: false
          });
          riskyEvents = result.length;
      }
  }

  return {
    upcomingEvents: upcomingCount,
    eventsThisMonth: monthCount,
    riskyEvents,
    cashStuck
  };
};

module.exports = {
  createEvent,
  getEvents,
  getUpcomingEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventStats
};
