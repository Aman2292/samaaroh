const Organization = require('../models/Organization');
const asyncHandler = require('express-async-handler');

// @desc    Get all venues for the organization
// @route   GET /api/venue
// @access  Private (PLANNER_OWNER)
const getVenues = asyncHandler(async (req, res) => {
    const organization = await Organization.findOne({ ownerUserId: req.user._id });

    if (!organization) {
        res.status(404);
        throw new Error('Organization not found');
    }

    res.status(200).json({
        success: true,
        count: organization.venues.length,
        data: organization.venues
    });
});

// @desc    Get single venue by ID
// @route   GET /api/venue/:id
// @access  Private (PLANNER_OWNER)
const getVenue = asyncHandler(async (req, res) => {
    const organization = await Organization.findOne({ ownerUserId: req.user._id });

    if (!organization) {
        res.status(404);
        throw new Error('Organization not found');
    }

    const venue = organization.venues.id(req.params.id);

    if (!venue) {
        res.status(404);
        throw new Error('Venue not found');
    }

    res.status(200).json({
        success: true,
        data: venue
    });
});

// @desc    Create a new venue
// @route   POST /api/venue
// @access  Private (PLANNER_OWNER)
const createVenue = asyncHandler(async (req, res) => {
    const organization = await Organization.findOne({ ownerUserId: req.user._id });

    if (!organization) {
        res.status(404);
        throw new Error('Organization not found');
    }

    const { category, description, address, amenities, policies } = req.body;

    const newVenue = {
        category,
        description,
        address,
        amenities,
        policies
    };

    organization.venues.push(newVenue);
    await organization.save();

    res.status(201).json({
        success: true,
        data: organization.venues[organization.venues.length - 1]
    });
});

// @desc    Update venue profile
// @route   PUT /api/venue/:id
// @access  Private (PLANNER_OWNER)
const updateVenue = asyncHandler(async (req, res) => {
    const organization = await Organization.findOne({ ownerUserId: req.user._id });

    if (!organization) {
        res.status(404);
        throw new Error('Organization not found');
    }

    const venue = organization.venues.id(req.params.id);

    if (!venue) {
        res.status(404);
        throw new Error('Venue not found');
    }

    const { category, description, address, amenities, policies, floorPlans, videoUrls } = req.body;

    if (category) venue.category = category;
    if (description) venue.description = description;
    if (address) venue.address = address;
    if (amenities) venue.amenities = amenities;
    if (policies) venue.policies = policies;
    if (floorPlans) venue.floorPlans = floorPlans;
    if (videoUrls) venue.videoUrls = videoUrls;

    await organization.save();

    res.status(200).json({
        success: true,
        data: venue
    });
});

// @desc    Add gallery images
// @route   POST /api/venue/:id/gallery
// @access  Private (PLANNER_OWNER)
const addGalleryImages = asyncHandler(async (req, res) => {
    const { images } = req.body; // Array of URLs
    const organization = await Organization.findOne({ ownerUserId: req.user._id });

    if (!organization) {
        res.status(404);
        throw new Error('Organization not found');
    }

    const venue = organization.venues.id(req.params.id);

    if (!venue) {
        res.status(404);
        throw new Error('Venue not found');
    }

    if (images && images.length > 0) {
        venue.galleryImages.push(...images);
        await organization.save();
    }

    res.status(200).json({
        success: true,
        data: venue.galleryImages
    });
});

// @desc    Delete gallery image
// @route   DELETE /api/venue/:id/gallery
// @access  Private (PLANNER_OWNER)
const deleteGalleryImage = asyncHandler(async (req, res) => {
    const { imageUrl } = req.body;
    const organization = await Organization.findOne({ ownerUserId: req.user._id });

    if (!organization) {
        res.status(404);
        throw new Error('Organization not found');
    }

    const venue = organization.venues.id(req.params.id);

    if (!venue) {
        res.status(404);
        throw new Error('Venue not found');
    }

    venue.galleryImages = venue.galleryImages.filter(img => img !== imageUrl);
    await organization.save();

    res.status(200).json({
        success: true,
        data: venue.galleryImages
    });
});

// @desc    Add package
// @route   POST /api/venue/:id/packages
// @access  Private (PLANNER_OWNER)
const addPackage = asyncHandler(async (req, res) => {
    const organization = await Organization.findOne({ ownerUserId: req.user._id });

    if (!organization) {
        res.status(404);
        throw new Error('Organization not found');
    }

    const venue = organization.venues.id(req.params.id);

    if (!venue) {
        res.status(404);
        throw new Error('Venue not found');
    }

    venue.packages.push(req.body);
    await organization.save();

    res.status(201).json({
        success: true,
        data: venue.packages
    });
});

// @desc    Update package
// @route   PUT /api/venue/:id/packages/:packageId
// @access  Private (PLANNER_OWNER)
const updatePackage = asyncHandler(async (req, res) => {
    const organization = await Organization.findOne({ ownerUserId: req.user._id });

    if (!organization) {
        res.status(404);
        throw new Error('Organization not found');
    }

    const venue = organization.venues.id(req.params.id);

    if (!venue) {
        res.status(404);
        throw new Error('Venue not found');
    }

    const pkg = venue.packages.id(req.params.packageId);

    if (!pkg) {
        res.status(404);
        throw new Error('Package not found');
    }

    Object.assign(pkg, req.body);
    await organization.save();

    res.status(200).json({
        success: true,
        data: venue.packages
    });
});

// @desc    Delete package
// @route   DELETE /api/venue/:id/packages/:packageId
// @access  Private (PLANNER_OWNER)
const deletePackage = asyncHandler(async (req, res) => {
    const organization = await Organization.findOne({ ownerUserId: req.user._id });

    if (!organization) {
        res.status(404);
        throw new Error('Organization not found');
    }

    const venue = organization.venues.id(req.params.id);

    if (!venue) {
        res.status(404);
        throw new Error('Venue not found');
    }

    venue.packages.pull(req.params.packageId);
    await organization.save();

    res.status(200).json({
        success: true,
        data: venue.packages
    });
});

// @desc    Update availability
// @route   PUT /api/venue/:id/availability
// @access  Private (PLANNER_OWNER)
const updateAvailability = asyncHandler(async (req, res) => {
    const organization = await Organization.findOne({ ownerUserId: req.user._id });

    if (!organization) {
        res.status(404);
        throw new Error('Organization not found');
    }

    const venue = organization.venues.id(req.params.id);

    if (!venue) {
        res.status(404);
        throw new Error('Venue not found');
    }

    const updates = Array.isArray(req.body) ? req.body : [req.body];

    for (const update of updates) {
        const { date, status, notes } = update;
        
        // Check if entry exists for date
        const existingIndex = venue.availability.findIndex(
            a => new Date(a.date).toDateString() === new Date(date).toDateString()
        );

        if (existingIndex >= 0) {
            venue.availability[existingIndex].status = status;
            venue.availability[existingIndex].notes = notes;
        } else {
            venue.availability.push({ date, status, notes });
        }
    }

    await organization.save();

    res.status(200).json({
        success: true,
        data: venue.availability
    });
});

module.exports = {
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
};
