const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access :eventId
const guestController = require('../controllers/guestController');

// Authentication already applied by parent route (eventRoutes.js)
// Authorization will be handled within controllers if needed

// Guest CRUD
router.post('/', guestController.addGuest);
router.get('/', guestController.getGuests);
router.get('/stats', guestController.getGuestStats);
router.put('/:guestId', guestController.updateGuest);
router.delete('/:guestId', guestController.deleteGuest);

// Quick add and check-in
router.post('/quick-add', guestController.quickAddGuest);
router.post('/:guestId/check-in', guestController.checkInGuest);

// CSV Import/Export
router.post('/bulk-import', guestController.bulkImportGuests);
router.get('/export', guestController.exportGuests);
router.get('/template', guestController.downloadTemplate);

module.exports = router;
