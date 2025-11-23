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
  const { email, password, name, phone, role, organizationName, city } = userData;

  // Only allow PLANNER_OWNER via public registration
  // Note: The frontend might send 'PLANNER_OWNER' or we default it here if not sent, 
  // but the plan says we enforce it.
  // If the user sends something else, we reject or override? 
  // The plan says: "Only allow PLANNER_OWNER via public registration"
  
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
      token: generateToken(user._id, user.role, user.organizationId),
    };
  } else {
    throw new Error('Invalid user data');
  }
};

const loginUser = async (userData) => {
  const { email, password } = userData;

  const user = await User.findOne({ email }).populate('organizationId', 'name phone email city');

  if (user && (await user.matchPassword(password))) {
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId?._id,
      organizationName: user.organizationId?.name,
      token: generateToken(user._id, user.role, user.organizationId?._id),
    };
  } else {
    throw new Error('Invalid email or password');
  }
};

module.exports = {
  registerUser,
  loginUser,
};
