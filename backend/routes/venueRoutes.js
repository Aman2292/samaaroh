const express = require('express');
const router = express.Router();
const {
    getVenues,
    getVenue,
    createVenue,
    updateVenue,
    addGalleryImages,
    deleteGalleryImage,
    addPackage,
    updatePackage,
    deletePackage,
    updateAvailability
} = require('../controllers/venueController');
const { protect, plannerOwner } = require('../middleware/authMiddleware');

router.use(protect);
router.use(plannerOwner);

router.route('/')
    .get(getVenues)
    .post(createVenue);

router.route('/:id')
    .get(getVenue)
    .put(updateVenue);

router.route('/:id/gallery')
    .post(addGalleryImages)
    .delete(deleteGalleryImage);

router.route('/:id/packages')
    .post(addPackage);

router.route('/:id/packages/:packageId')
    .put(updatePackage)
    .delete(deletePackage);

router.route('/:id/availability')
    .put(updateAvailability);

module.exports = router;
