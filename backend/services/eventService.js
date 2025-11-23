const Event = require('../models/Event');
const Client = require('../models/Client');
const { startOfDay, endOfDay, addDays } = require('date-fns');

/**
 * Create a new event
 */
const createEvent = async (eventData) => {
  // Verify client exists and belongs to organization
  const client = await Client.findOne({
    _id: eventData.clientId,
    organizationId: eventData.organizationId,
    isActive: true
  });

  if (!client) {
    throw new Error('Client not found or does not belong to your organization');
  }

  const event = await Event.create(eventData);
  return event;
};

/**
 * Get events for an organization with filters and pagination
 */
const getEvents = async (organizationId, filters, { page = 1, limit = 20 }) => {
  const query = { isActive: true };

  // If organizationId is provided (not SUPER_ADMIN), filter by it
  if (organizationId) {
    query.organizationId = organizationId;
  }

  // Apply additional filters from middleware (role-based)
  Object.assign(query, filters);

  // Status filter
  if (filters.status) {
    query.status = filters.status;
  }

  // Event type filter
  if (filters.eventType) {
    query.eventType = filters.eventType;
  }

  // Date range filter
  if (filters.dateFrom || filters.dateTo) {
    query.eventDate = {};
    if (filters.dateFrom) {
      query.eventDate.$gte = startOfDay(new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      query.eventDate.$lte = endOfDay(new Date(filters.dateTo));
    }
  }

  // Planner filter
  if (filters.plannerId) {
    query.leadPlannerId = filters.plannerId;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { eventDate: 1 },
    populate: [
      { path: 'clientId', select: 'name phone email' },
      { path: 'leadPlannerId', select: 'name email' },
      { path: 'createdBy', select: 'name email' }
    ]
  };

  const result = await Event.paginate(query, options);
  return result;
};

/**
 * Get upcoming events (next 7 days)
 */
const getUpcomingEvents = async (organizationId, filters) => {
  const today = startOfDay(new Date());
  const nextWeek = endOfDay(addDays(today, 7));

  const query = {
    isActive: true,
    eventDate: { $gte: today, $lte: nextWeek },
    status: { $in: ['booked', 'in_progress'] }
  };

  // If organizationId is provided (not SUPER_ADMIN), filter by it
  if (organizationId) {
    query.organizationId = organizationId;
  }

  // Apply role-based filters
  Object.assign(query, filters);

  const events = await Event.find(query)
    .populate('clientId', 'name phone')
    .populate('leadPlannerId', 'name')
    .sort({ eventDate: 1 });

  return events;
};

/**
 * Get a single event by ID
 */
const getEventById = async (eventId) => {
  const event = await Event.findById(eventId)
    .populate('clientId', 'name phone email city')
    .populate('leadPlannerId', 'name email role')
    .populate('assignedCoordinators', 'name email role')
    .populate('createdBy', 'name email');

  return event;
};

/**
 * Update an event
 */
const updateEvent = async (eventId, updateData, userId, userRole) => {
  const event = await Event.findById(eventId);

  if (!event) {
    throw new Error('Event not found');
  }

  // Check permissions: SUPER_ADMIN, PLANNER_OWNER or assigned lead planner can update
  if (userRole !== 'SUPER_ADMIN' && userRole !== 'PLANNER_OWNER' && event.leadPlannerId.toString() !== userId.toString()) {
    throw new Error('You do not have permission to update this event');
  }

  const updatedEvent = await Event.findByIdAndUpdate(
    eventId,
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true }
  ).populate('clientId leadPlannerId assignedCoordinators createdBy');

  return updatedEvent;
};

/**
 * Soft delete an event
 */
const deleteEvent = async (eventId) => {
  const event = await Event.findByIdAndUpdate(
    eventId,
    { isActive: false, updatedAt: Date.now() },
    { new: true }
  );

  return event;
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

  return {
    upcomingEvents: upcomingCount,
    eventsThisMonth: monthCount
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
