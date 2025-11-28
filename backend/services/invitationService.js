const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Verify invitation token
 */
const verifyInvitationToken = async (token) => {
  const user = await User.findOne({
    invitationToken: token,
    invitationStatus: 'pending',
    invitationExpiresAt: { $gt: new Date() }
  }).populate('organizationId', 'name');

  if (!user) {
    throw new Error('Invalid or expired invitation token');
  }

  return user;
};

/**
 * Accept invitation and set password
 */
const acceptInvitation = async (token, newPassword) => {
  const user = await verifyInvitationToken(token);

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update user
  user.password = hashedPassword;
  user.invitationStatus = 'accepted';
  user.invitationToken = undefined;
  user.invitationSentAt = undefined;
  user.invitationExpiresAt = undefined;
  user.isActive = true;

  await user.save();

  return user;
};

module.exports = {
  verifyInvitationToken,
  acceptInvitation
};
