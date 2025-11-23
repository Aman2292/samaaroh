const Client = require('../models/Client');
const Event = require('../models/Event');

/**
 * Middleware to automatically scope queries to the user's organization
 */
const scopeToOrganization = (req, res, next) => {
  if (req.user && req.user.organizationId) {
    req.organizationId = req.user.organizationId;
  }
  next();
};

/**
 * Middleware to verify that a resource belongs to the user's organization
 */
const verifyOwnership = (Model) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found'
        });
      }

      // SUPER_ADMIN can access all resources
      if (req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      // Check if resource belongs to user's organization
      if (resource.organizationId.toString() !== req.user.organizationId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to access this resource'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Error verifying resource ownership',
        details: error.message
      });
    }
  };
};

/**
 * Middleware to apply role-based permissions for events
 * PLANNER: Only see events where they are the lead planner
 * FINANCE: Read-only access to all organization events
 * COORDINATOR: Only see events where they are assigned
 * PLANNER_OWNER: See all organization events
 */
const applyRolePermissions = (req, res, next) => {
  const { role, _id: userId } = req.user;

  // Initialize filters object if it doesn't exist
  if (!req.filters) {
    req.filters = {};
  }

  // Apply role-based filters
  if (role === 'PLANNER') {
    req.filters.leadPlannerId = userId;
  } else if (role === 'COORDINATOR') {
    req.filters.assignedCoordinators = userId;
  }
  // PLANNER_OWNER and FINANCE see all organization events (no additional filter)
  // SUPER_ADMIN sees everything (handled elsewhere)

  next();
};

module.exports = {
  scopeToOrganization,
  verifyOwnership,
  applyRolePermissions
};
