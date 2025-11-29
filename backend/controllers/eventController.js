const eventService = require('../services/eventService');
const { logActivity } = require('../utils/activityLogger');

/**
 * @route   POST /api/events
 * @desc    Create a new event
 * @access  Private
 */
const createEvent = async (req, res, next) => {
  try {
    const eventData = {
      ...req.body,
      organizationId: req.user.organizationId,
      createdBy: req.user._id
    };

    const event = await eventService.createEvent(eventData);

    // Log activity
    await logActivity(
      req.user._id,
      req.user.role,
      'create_event',
      'event',
      event._id,
      event.eventName,
      { eventType: event.eventType, eventDate: event.eventDate },
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown',
      req.user.organizationId
    );

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/events
 * @desc    Get all events for the organization
 * @access  Private
 */
const getEvents = async (req, res, next) => {
  try {
    const { page, limit, status, eventType, dateFrom, dateTo, plannerId } = req.query;
    const organizationId = req.user.organizationId;

    // Combine query filters with role-based filters from middleware
    const filters = {
      ...req.filters,
      ...(status && { status }),
      ...(eventType && { eventType }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
      ...(plannerId && { plannerId })
    };

    const result = await eventService.getEvents(organizationId, filters, { page, limit });

    res.json({
      success: true,
      data: result.docs,
      pagination: {
        total: result.totalDocs,
        page: result.page,
        pages: result.totalPages,
        limit: result.limit
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/events/upcoming
 * @desc    Get upcoming events (next 7 days)
 * @access  Private
 */
const getUpcomingEvents = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const events = await eventService.getUpcomingEvents(organizationId, req.filters || {});

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/events/stats
 * @desc    Get event statistics for dashboard
 * @access  Private
 */
const getEventStats = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const stats = await eventService.getEventStats(organizationId, req.filters || {});

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/events/:id
 * @desc    Get a single event
 * @access  Private
 */
const getEvent = async (req, res, next) => {
  try {
    const event = await eventService.getEventById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/events/:id
 * @desc    Update an event
 * @access  Private
 */
const updateEvent = async (req, res, next) => {
  try {
    const event = await eventService.updateEvent(
      req.params.id,
      req.body,
      req.user._id,
      req.user.role
    );

    // Log activity
    await logActivity(
      req.user._id,
      req.user.role,
      'update_event',
      'event',
      event._id,
      event.eventName,
      { updatedFields: Object.keys(req.body) },
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown',
      req.user.organizationId
    );

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/events/:id
 * @desc    Soft delete an event
 * @access  Private
 */
const deleteEvent = async (req, res, next) => {
  try {
    const event = await eventService.deleteEvent(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Log activity
    await logActivity(
      req.user._id,
      req.user.role,
      'delete_event',
      'event',
      event._id,
      event.eventName,
      {},
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown',
      req.user.organizationId
    );

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEvent,
  getEvents,
  getUpcomingEvents,
  getEventStats,
  getEvent,
  updateEvent,
  deleteEvent
};
