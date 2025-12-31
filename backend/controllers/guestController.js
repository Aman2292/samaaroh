const guestService = require('../services/guestService');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * @route   POST /api/guests
 * @desc    Create a single guest
 * @access  Private
 */
const createGuest = async (req, res, next) => {
  try {
    const guest = await guestService.createGuest(
      req.body,
      req.user._id,
      req.user.organizationId
    );

    res.status(201).json({
      success: true,
      data: guest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/guests/event/:eventId
 * @desc    Get all guests for an event
 * @access  Private
 */
const getEventGuests = async (req, res, next) => {
  try {
    const { rsvpStatus, side, guestType, search } = req.query;
    
    const guests = await guestService.getEventGuests(
      req.params.eventId,
      req.user.organizationId,
      { rsvpStatus, side, guestType, search }
    );

    res.json({
      success: true,
      data: guests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/guests/:id
 * @desc    Get single guest by ID
 * @access  Private
 */
const getGuestById = async (req, res, next) => {
  try {
    const guest = await guestService.getGuestById(
      req.params.id,
      req.user.organizationId
    );

    res.json({
      success: true,
      data: guest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/guests/rsvp/:token
 * @desc    Get guest by RSVP token (public - no auth)
 * @access  Public
 */
const getGuestByToken = async (req, res, next) => {
  try {
    const guest = await guestService.getGuestByToken(req.params.token);

    res.json({
      success: true,
      data: guest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/guests/:id
 * @desc    Update guest
 * @access  Private
 */
const updateGuest = async (req, res, next) => {
  try {
    const guest = await guestService.updateGuest(
      req.params.id,
      req.body,
      req.user.organizationId,
      req.user._id
    );

    res.json({
      success: true,
      data: guest,
      message: 'Guest updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/guests/rsvp/:token
 * @desc    Submit RSVP (public - no auth)
 * @access  Public
 */
const submitRSVP = async (req, res, next) => {
  try {
    const guest = await guestService.submitRSVP(
      req.params.token,
      req.body
    );

    res.json({
      success: true,
      data: guest,
      message: 'RSVP submitted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/guests/:id
 * @desc    Delete guest (soft delete)
 * @access  Private
 */
const deleteGuest = async (req, res, next) => {
  try {
    await guestService.deleteGuest(
      req.params.id,
      req.user.organizationId
    );

    res.json({
      success: true,
      message: 'Guest deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/guests/bulk-delete
 * @desc    Bulk delete guests
 * @access  Private
 */
const bulkDeleteGuests = async (req, res, next) => {
  try {
    const { guestIds } = req.body;

    if (!guestIds || guestIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No guest IDs provided'
      });
    }

    const result = await guestService.bulkDeleteGuests(
      guestIds,
      req.user.organizationId
    );

    res.json({
      success: true,
      data: result,
      message: `${result.modifiedCount} guests deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/guests/import-excel
 * @desc    Bulk import guests from Excel
 * @access  Private
 */
const importExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'Event ID is required'
      });
    }

    const result = await guestService.bulkImportGuests(
      req.file.buffer,
      eventId,
      req.user.organizationId,
      req.user._id
    );

    res.json({
      success: true,
      data: result,
      message: `${result.imported} guests imported successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/guests/event/:eventId/stats
 * @desc    Get RSVP statistics for an event
 * @access  Private
 */
const getRSVPStats = async (req, res, next) => {
  try {
    const stats = await guestService.getRSVPStats(
      req.params.eventId,
      req.user.organizationId
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/guests/event/:eventId/export
 * @desc    Export guests to Excel
 * @access  Private
 */
const exportGuestsToExcel = async (req, res, next) => {
  try {
    const buffer = await guestService.exportGuestsToExcel(
      req.params.eventId,
      req.user.organizationId
    );

    // Get event name for filename
    const Event = require('../models/Event');
    const event = await Event.findById(req.params.eventId);
    const filename = `${event?.eventName || 'Event'}_Guests_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/guests/send-invitations
 * @desc    Mark invitations as sent and get RSVP links
 * @access  Private
 */
const sendInvitations = async (req, res, next) => {
  try {
    const { guestIds } = req.body;

    if (!guestIds || guestIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No guest IDs provided'
      });
    }

    const guests = await guestService.markInvitationsSent(
      guestIds,
      req.user.organizationId,
      req.user._id
    );

    res.json({
      success: true,
      data: guests,
      message: `Invitations marked as sent for ${guests.length} guests`
    });
  } catch (error) {
    next(error);
  }
};

// ====== QR CODE CHECK-IN METHODS ======

const qrCodeService = require('../services/qrCodeService');

/**
 * @route   POST /api/guests/scan
 * @desc    Scan QR code and get guest info
 * @access  Private
 */
const scanQRCode = async (req, res, next) => {
  try {
    const { qrCode } = req.body;
    
    if (!qrCode) {
      return res.status(400).json({
        success: false,
        error: 'QR code is required'
      });
    }
    
    const result = await qrCodeService.findByQRCode(qrCode);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Invalid QR code - Guest not found'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/guests/:id/generate-qr
 * @desc    Generate QR code for a guest
 * @access  Private
 */
const generateQRCode = async (req, res, next) => {
  try {
    const guest = await qrCodeService.generateQRForGuest(req.params.id);
    
    res.json({
      success: true,
      data: guest,
      message: 'QR code generated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/guests/event/:eventId/generate-all-qrs
 * @desc    Bulk generate QR codes for all guests in an event
 * @access  Private
 */
const generateAllQRCodes = async (req, res, next) => {
  try {
    const results = await qrCodeService.generateQRsForEvent(req.params.eventId);
    
    res.json({
      success: true,
      data: results,
      message: `Generated QR codes: ${results.success} success, ${results.failed} failed`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/guests/:id/check-in
 * @desc    Check in a guest (family mode)
 * @access  Private
 */
const checkInGuest = async (req, res, next) => {
  try {
    const { actualHeadcount, notes } = req.body;
    
    const guest = await qrCodeService.checkInFamily(
      req.params.id,
      actualHeadcount || 1,
      req.user._id,
      notes || ''
    );
    
    res.json({
      success: true,
      data: guest,
      message: `Successfully checked in ${guest.fullName} with ${actualHeadcount} guest(s)`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/guests/:id/check-in-member/:memberIndex
 * @desc    Check in individual family member
 * @access  Private
 */
const checkInMember = async (req, res, next) => {
  try {
    const guest = await qrCodeService.checkInMember(
      req.params.id,
      parseInt(req.params.memberIndex),
      req.user._id
    );
    
    res.json({
      success: true,
      data: guest,
      message: 'Member checked in successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/guests/:id/undo-check-in
 * @desc    Undo guest check-in
 * @access  Private
 */
const undoCheckIn = async (req, res, next) => {
  try {
    const guest = await qrCodeService.undoCheckIn(req.params.id);
    
    res.json({
      success: true,
      data: guest,
      message: 'Check-in undone successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/guests/event/:eventId/check-in-stats
 * @desc    Get check-in statistics for an event
 * @access  Private
 */
const getCheckInStats = async (req, res, next) => {
  try {
    const stats = await qrCodeService.getEventCheckInStats(req.params.eventId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGuest,
  getEventGuests,
  getGuestById,
  getGuestByToken,
  updateGuest,
  submitRSVP,
  deleteGuest,
  bulkDeleteGuests,
  importExcel: [upload.single('file'), importExcel],
  getRSVPStats,
  exportGuestsToExcel,
  sendInvitations,
  // QR Check-In
  scanQRCode,
  generateQRCode,
  generateAllQRCodes,
  checkInGuest,
  checkInMember,
  undoCheckIn,
  getCheckInStats
};
