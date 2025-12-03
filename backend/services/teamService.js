const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendInvitationEmail } = require('./emailService');

/**
 * Create a team member (PLANNER, FINANCE, COORDINATOR)
 * Only PLANNER_OWNER can create team members
 */
const createTeamMember = async (teamMemberData, creatorId, organizationId) => {
  const { email, name, phone, role } = teamMemberData;

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

  // Generate random password (will be changed by user)
  const tempPassword = crypto.randomBytes(16).toString('hex');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(tempPassword, salt);

  // Generate invitation token
  const invitationToken = crypto.randomBytes(32).toString('hex');
  const invitationExpiresAt = new Date();
  invitationExpiresAt.setDate(invitationExpiresAt.getDate() + 7); // 7 days expiry

  // Create team member
  const teamMember = await User.create({
    email,
    password: hashedPassword,
    name,
    phone,
    role,
    organizationId,
    createdBy: creatorId,
    invitationStatus: 'pending',
    invitationToken,
    invitationSentAt: new Date(),
    invitationExpiresAt,
    isActive: false // Will be activated when they accept invitation
  });

  // Get organization details for email
  const Organization = require('../models/Organization');
  const organization = await Organization.findById(organizationId);

  // Send invitation email
  try {
    await sendInvitationEmail(
      email,
      name,
      organization.name,
      role,
      invitationToken
    );
  } catch (emailError) {
    console.error('Failed to send invitation email:', emailError);
    // Don't throw - user is created, email can be resent
  }

  // Add user to organization's teamMembers array
  await Organization.findByIdAndUpdate(organizationId, {
    $push: { teamMembers: teamMember._id }
  });

  return {
    _id: teamMember._id,
    email: teamMember.email,
    name: teamMember.name,
    phone: teamMember.phone,
    role: teamMember.role,
    organizationId: teamMember.organizationId,
    invitationStatus: teamMember.invitationStatus
  };
};

/**
 * Get all team members for an organization
 */
const getTeamMembers = async (organizationId) => {
  const teamMembers = await User.find({
    organizationId,
    role: { $in: ['PLANNER_OWNER', 'PLANNER', 'FINANCE', 'COORDINATOR'] }
  }).select('-password -invitationToken').sort({ createdAt: -1 });

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

/**
 * Delete team member (Hard delete)
 * Used for cancelling invitations or removing users completely
 */
const deleteTeamMember = async (userId) => {
  const user = await User.findByIdAndDelete(userId);
  
  if (user) {
    // Remove from organization's teamMembers array
    const Organization = require('../models/Organization');
    await Organization.findByIdAndUpdate(user.organizationId, {
      $pull: { teamMembers: userId }
    });
  }
  
  return user;
};

module.exports = {
  createTeamMember,
  getTeamMembers,
  updateTeamMember,
  deactivateTeamMember,
  deleteTeamMember
};
