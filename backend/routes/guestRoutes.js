const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// All routes require authentication except public RSVP
router.use((req, res, next) => {
  // Allow public RSVP routes
  if (req.path.includes('/rsvp/')) {
    return next();
  }
  // All other routes require authentication
  protect(req, res, next);
});

// Guest CRUD
router.post('/', guestController.createGuest);
router.get('/event/:eventId', guestController.getEventGuests);

// Bulk operations (before :id route)
router.post('/bulk-delete', guestController.bulkDeleteGuests);
router.post('/import-excel', guestController.importExcel);

// Statistics (before :id route)
router.get('/event/:eventId/stats', guestController.getRSVPStats);

// Export (before :id route)
router.get('/event/:eventId/export', guestController.exportGuestsToExcel);

// Invitations (before :id route)
router.post('/send-invitations', guestController.sendInvitations);

// Single guest operations (after specific routes)
router.get('/:id', guestController.getGuestById);
router.put('/:id', guestController.updateGuest);
router.delete('/:id', guestController.deleteGuest);

// QR Code Check-In Routes
router.post('/scan', guestController.scanQRCode);
router.post('/:id/generate-qr', guestController.generateQRCode);
router.post('/event/:eventId/generate-all-qrs', guestController.generateAllQRCodes);
router.post('/:id/check-in', guestController.checkInGuest);
router.post('/:id/check-in-member/:memberIndex', guestController.checkInMember);
router.post('/:id/undo-check-in', guestController.undoCheckIn);
router.get('/event/:eventId/check-in-stats', guestController.getCheckInStats);

// Public RSVP (no auth required)
router.get('/rsvp/:token', guestController.getGuestByToken);
router.post('/rsvp/:token', guestController.submitRSVP);

module.exports = router;
