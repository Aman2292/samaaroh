const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // Attach organization if exists
      if (req.user.organizationId) {
        req.organization = await Organization.findById(req.user.organizationId);
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const requireOrganization = (req, res, next) => {
  if (req.user && (req.user.organizationId || req.user.role === 'SUPER_ADMIN')) {
    next();
  } else {
    res.status(403).json({ message: 'Organization context required' });
  }
};

// Restrict access to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Not authenticated' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        error: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

const plannerOwner = restrictTo('PLANNER_OWNER');

module.exports = { protect, requireOrganization, restrictTo, plannerOwner };
