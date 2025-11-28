const Organization = require('../models/Organization');
const User = require('../models/User');
const Event = require('../models/Event');
const Client = require('../models/Client');
const Payment = require('../models/Payment');
const { logActivity } = require('../utils/activityLogger');

/**
 * @route   PUT /api/organization/settings
 * @desc    Update organization settings
 * @access  Private (PLANNER_OWNER only)
 */
const updateSettings = async (req, res, next) => {
  try {
    const { name, phone, email, city, address, website } = req.body;
    
    const organization = await Organization.findById(req.user.organizationId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // Update fields
    if (name) organization.name = name;
    if (phone) organization.phone = phone;
    if (email) organization.email = email;
    if (city) organization.city = city;
    if (address !== undefined) organization.address = address;
    if (website !== undefined) organization.website = website;

    await organization.save();

    // Log activity
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    
    await logActivity(
      req.user._id,
      req.user.role,
      'update_organization_settings',
      'organization',
      organization._id,
      organization.name,
      { fields: Object.keys(req.body) },
      ipAddress,
      userAgent,
      organization._id
    );

    res.json({
      success: true,
      data: organization,
      message: 'Organization settings updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/organization/transfer-ownership
 * @desc    Transfer organization ownership to another team member
 * @access  Private (PLANNER_OWNER only)
 */
const transferOwnership = async (req, res, next) => {
  try {
    const { newOwnerId, password } = req.body;

    if (!newOwnerId || !password) {
      return res.status(400).json({
        success: false,
        error: 'New owner ID and password are required'
      });
    }

    // Verify current user's password
    const currentUser = await User.findById(req.user._id);
    const isPasswordValid = await currentUser.matchPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password'
      });
    }

    // Get new owner
    const newOwner = await User.findById(newOwnerId);

    if (!newOwner) {
      return res.status(404).json({
        success: false,
        error: 'New owner not found'
      });
    }

    // Verify new owner is in same organization and is a PLANNER
    if (newOwner.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(400).json({
        success: false,
        error: 'New owner must be in the same organization'
      });
    }

    if (newOwner.role !== 'PLANNER') {
      return res.status(400).json({
        success: false,
        error: 'New owner must have PLANNER role'
      });
    }

    // Start transaction
    const organization = await Organization.findById(req.user.organizationId);

    // Update organization owner
    organization.ownerUserId = newOwnerId;
    await organization.save();

    // Update new owner role
    newOwner.role = 'PLANNER_OWNER';
    await newOwner.save();

    // Update current owner role
    currentUser.role = 'PLANNER';
    await currentUser.save();

    // Log activity
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    
    await logActivity(
      req.user._id,
      'PLANNER', // Current user is now PLANNER
      'transfer_ownership',
      'organization',
      organization._id,
      organization.name,
      { newOwner: newOwner.name, newOwnerId: newOwnerId },
      ipAddress,
      userAgent,
      organization._id
    );

    res.json({
      success: true,
      message: 'Ownership transferred successfully. Please log in again.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/organization
 * @desc    Delete organization (soft delete)
 * @access  Private (PLANNER_OWNER only)
 */
const deleteOrganization = async (req, res, next) => {
  try {
    const { organizationName, password } = req.body;

    if (!organizationName || !password) {
      return res.status(400).json({
        success: false,
        error: 'Organization name and password are required'
      });
    }

    // Verify password
    const currentUser = await User.findById(req.user._id);
    const isPasswordValid = await currentUser.matchPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password'
      });
    }

    const organization = await Organization.findById(req.user.organizationId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // Verify organization name
    if (organization.name !== organizationName) {
      return res.status(400).json({
        success: false,
        error: 'Organization name does not match'
      });
    }

    // Get counts for confirmation
    const clientsCount = await Client.countDocuments({ organizationId: organization._id, isDeleted: false });
    const eventsCount = await Event.countDocuments({ organizationId: organization._id, isDeleted: false });
    const paymentsCount = await Payment.countDocuments({ organizationId: organization._id });
    const usersCount = await User.countDocuments({ organizationId: organization._id, isActive: true });

    // Soft delete organization
    organization.isActive = false;
    await organization.save();

    // Soft delete all users
    await User.updateMany(
      { organizationId: organization._id },
      { $set: { isActive: false } }
    );

    // Soft delete all clients
    await Client.updateMany(
      { organizationId: organization._id },
      { $set: { isDeleted: true } }
    );

    // Soft delete all events
    await Event.updateMany(
      { organizationId: organization._id },
      { $set: { isDeleted: true } }
    );

    // Log activity
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    
    await logActivity(
      req.user._id,
      req.user.role,
      'delete_organization',
      'organization',
      organization._id,
      organization.name,
      { clientsCount, eventsCount, paymentsCount, usersCount },
      ipAddress,
      userAgent,
      organization._id
    );

    res.json({
      success: true,
      message: 'Organization deleted successfully',
      data: {
        deletedCounts: {
          clients: clientsCount,
          events: eventsCount,
          payments: paymentsCount,
          users: usersCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateSettings,
  transferOwnership,
  deleteOrganization
};
