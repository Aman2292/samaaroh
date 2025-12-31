const User = require('../models/User');
const Organization = require('../models/Organization');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id, role, organizationId) => {
  return jwt.sign({ id, role, organizationId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const registerUser = async (userData) => {
  const { email, password, name, phone, role, organizationName, city, preferredLanguage } = userData;

  // Only allow PLANNER_OWNER via public registration
  const effectiveRole = role || 'PLANNER_OWNER';

  if (effectiveRole !== 'PLANNER_OWNER') {
    throw new Error('Invalid registration role. Only business owners can register.');
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new Error('User already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create Organization first
  const organization = await Organization.create({
    name: organizationName,
    phone,
    city,
    email,
    isActive: true,
  });

  // Create User
  const user = await User.create({
    email,
    password: hashedPassword,
    name,
    phone,
    role: 'PLANNER_OWNER',
    organizationId: organization._id,
    preferredLanguage: preferredLanguage || 'en',
    isActive: true,
  });

  // Update Organization with ownerUserId
  organization.ownerUserId = user._id;
  await organization.save();

  if (user) {
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: organization.name,
      preferredLanguage: user.preferredLanguage,
      token: generateToken(user._id, user.role, user.organizationId),
    };
  } else {
    throw new Error('Invalid user data');
  }
};

const loginUser = async (userData, ipAddress, userAgent) => {
  const { email, password } = userData;

  const user = await User.findOne({ email }).populate('organizationId', 'name phone email city status subscribedFeatures');

  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    throw new Error('Your account has been deactivated. Please contact support.');
  }

  // Check if organization is suspended (for non-SUPER_ADMIN)
  if (user.role !== 'SUPER_ADMIN' && user.organizationId && user.organizationId.status === 'suspended') {
    throw new Error('Your organization has been suspended. Please contact support.');
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  // Update last login info
  user.lastLogin = new Date();
  user.lastLoginIP = ipAddress;

  // Add to login history (keep last 10)
  if (!user.loginHistory) {
    user.loginHistory = [];
  }
  user.loginHistory.unshift({
    timestamp: new Date(),
    ip: ipAddress,
    userAgent: userAgent
  });
  if (user.loginHistory.length > 10) {
    user.loginHistory = user.loginHistory.slice(0, 10);
  }

  await user.save();

  // Log login activity
  const ActivityLog = require('../models/ActivityLog');
  await ActivityLog.create({
    userId: user._id,
    userRole: user.role,
    action: 'login',
    targetType: 'system',
    ipAddress,
    userAgent,
    organizationId: user.organizationId?._id
  });

  return {
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId?._id,
    organizationName: user.organizationId?.name,
    subscribedFeatures: user.organizationId?.subscribedFeatures,
    preferredLanguage: user.preferredLanguage,
    token: generateToken(user._id, user.role, user.organizationId?._id),
  };
};

module.exports = {
  registerUser,
  loginUser,
};
