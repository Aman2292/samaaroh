const guestService = require('../services/guestService');

/**
 * @route   POST /api/events/:eventId/guests
 * @desc    Add guest to event
 * @access  Private (PLANNER_OWNER, PLANNER)
 */
const addGuest = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const guestData = req.body;
    const organizationId = req.user.organizationId;
    const userId = req.user._id;

    const guest = await guestService.addGuest(eventId, guestData, organizationId, userId);

    // Activity logging temporarily disabled

    res.status(201).json({
      success: true,
      data: guest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/events/:eventId/guests
 * @desc    Get all guests for event with filters
 * @access  Private
 */
const getGuests = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const organizationId = req.user.organizationId;
    const filters = {
      side: req.query.side,
      group: req.query.group,
      rsvpStatus: req.query.rsvpStatus,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await guestService.getEventGuests(eventId, organizationId, filters);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/events/:eventId/guests/stats
 * @desc    Get guest statistics
 * @access  Private
 */
const getGuestStats = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const organizationId = req.user.organizationId;

    const stats = await guestService.getGuestStats(eventId, organizationId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/events/:eventId/guests/:guestId
 * @desc    Update guest
 * @access  Private (PLANNER_OWNER, PLANNER)
 */
const updateGuest = async (req, res, next) => {
  try {
    const { eventId, guestId } = req.params;
    const updateData = req.body;
    const organizationId = req.user.organizationId;

    const guest = await guestService.updateGuest(eventId, guestId, updateData, organizationId);

    // Activity logging temporarily disabled

    res.json({
      success: true,
      data: guest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/events/:eventId/guests/:guestId
 * @desc    Delete guest
 * @access  Private (PLANNER_OWNER, PLANNER)
 */
const deleteGuest = async (req, res, next) => {
  try {
    const { eventId, guestId } = req.params;
    const organizationId = req.user.organizationId;

    const result = await guestService.deleteGuest(eventId, guestId, organizationId);

    // Activity logging temporarily disabled

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/events/:eventId/guests/quick-add
 * @desc    Quick add guest (on-site/wedding day)
 * @access  Private (PLANNER_OWNER, PLANNER, COORDINATOR)
 */
const quickAddGuest = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const guestData = req.body;
    const organizationId = req.user.organizationId;
    const userId = req.user._id;

    const guest = await guestService.quickAddGuest(eventId, guestData, organizationId, userId);

    // Activity logging temporarily disabled

    res.status(201).json({
      success: true,
      data: guest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/events/:eventId/guests/:guestId/check-in
 * @desc    Check in guest
 * @access  Private (PLANNER_OWNER, PLANNER, COORDINATOR)
 */
const checkInGuest = async (req, res, next) => {
  try {
    const { eventId, guestId } = req.params;
    const organizationId = req.user.organizationId;

    const guest = await guestService.checkInGuest(eventId, guestId, organizationId);

    // Activity logging temporarily disabled

    res.json({
      success: true,
      data: guest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/events/:eventId/guests/bulk-import
 * @desc    Bulk import guests from CSV
 * @access  Private (PLANNER_OWNER, PLANNER)
 */
const bulkImportGuests = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const guestsData = req.body.guests; // Array of guest objects from parsed CSV
    const organizationId = req.user.organizationId;
    const userId = req.user._id;

    if (!guestsData || !Array.isArray(guestsData) || guestsData.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No guest data provided. Expected array of guests.'
      });
    }

    const results = await guestService.bulkImportGuests(eventId, guestsData, organizationId, userId);

    // Activity logging temporarily disabled

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/events/:eventId/guests/export
 * @desc    Export guests to CSV
 * @access  Private
 */
const exportGuests = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const organizationId = req.user.organizationId;
    const filters = {
      side: req.query.side,
      group: req.query.group,
      rsvpStatus: req.query.rsvpStatus
    };

    const guestsData = await guestService.exportGuests(eventId, organizationId, filters);

    const { stringify } = require('csv-stringify/sync');
    const csv = stringify(guestsData, { header: true });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=guests-${eventId}.csv`);
    
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/events/:eventId/guests/template
 * @desc    Download CSV template
 * @access  Private
 */
const downloadTemplate = async (req, res, next) => {
  try {
    const templateData = guestService.getCSVTemplate();

    const { stringify } = require('csv-stringify/sync');
    const csv = stringify(templateData, { header: true });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=guest-import-template.csv');
    
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addGuest,
  getGuests,
  getGuestStats,
  updateGuest,
  deleteGuest,
  quickAddGuest,
  checkInGuest,
  bulkImportGuests,
  exportGuests,
  downloadTemplate
};
