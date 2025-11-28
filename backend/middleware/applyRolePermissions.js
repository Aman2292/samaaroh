/**
 * Role-based permissions middleware
 * Applies automatic filtering based on user role
 */
const applyRolePermissions = (req, res, next) => {
  const { role, _id: userId } = req.user;
  
  // Initialize filters object if it doesn't exist
  if (!req.roleFilters) {
    req.roleFilters = {};
  }

  // PLANNER role: Can only see events where they are the lead planner
  if (role === 'PLANNER') {
    req.roleFilters.leadPlannerId = userId;
  }

  // FINANCE role: Can see all events but has limited edit permissions
  // No additional filters needed for FINANCE

  // PLANNER_OWNER: Can see all organization events
  // No additional filters needed for PLANNER_OWNER

  // SUPER_ADMIN: Can see everything
  // No filters needed

  next();
};

module.exports = applyRolePermissions;
