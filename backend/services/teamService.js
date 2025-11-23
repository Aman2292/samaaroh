const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Create a team member (PLANNER, FINANCE, COORDINATOR)
 * Only PLANNER_OWNER can create team members
 */
const createTeamMember = async (teamMemberData, creatorId, organizationId) => {
  const { email, password, name, phone, role } = teamMemberData;

  // Validate role
  const allowedRoles = ['PLANNER', 'FINANCE', 'COORDINATOR'];
  if (!allowedRoles.includes(role)) {
    throw new Error('Invalid role. Only PLANNER, FINANCE, and COORDINATOR can be created');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create team member
  const teamMember = await User.create({
    email,
    password: hashedPassword,
    name,
    phone,
    role,
    organizationId,
    createdBy: creatorId,
    isActive: true
  });

  return {
    _id: teamMember._id,
    email: teamMember.email,
    name: teamMember.name,
    phone: teamMember.phone,
    role: teamMember.role,
    organizationId: teamMember.organizationId
  };
};

/**
 * Get all team members for an organization
 */
const getTeamMembers = async (organizationId) => {
  const teamMembers = await User.find({
    organizationId,
    isActive: true,
    role: { $in: ['PLANNER_OWNER', 'PLANNER', 'FINANCE', 'COORDINATOR'] }
  }).select('-password').sort({ createdAt: -1 });

  return teamMembers;
};

/**
 * Update team member
 */
const updateTeamMember = async (userId, updateData) => {
  // Don't allow role or organizationId changes
  delete updateData.role;
  delete updateData.organizationId;
  delete updateData.password;

  const user = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  return user;
};

/**
 * Deactivate team member
 */
const deactivateTeamMember = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { isActive: false },
    { new: true }
  ).select('-password');

  return user;
};

module.exports = {
  createTeamMember,
  getTeamMembers,
  updateTeamMember,
  deactivateTeamMember
};
