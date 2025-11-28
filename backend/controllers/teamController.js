const teamService = require('../services/teamService');

/**
 * @route   POST /api/team
 * @desc    Create a team member (PLANNER_OWNER only)
 * @access  Private
 */
const createTeamMember = async (req, res, next) => {
  try {
    // Only PLANNER_OWNER can create team members
    if (req.user.role !== 'PLANNER_OWNER') {
      return res.status(403).json({
        success: false,
        error: 'Only organization owners can create team members'
      });
    }

    const teamMember = await teamService.createTeamMember(
      req.body,
      req.user._id,
      req.user.organizationId
    );

    res.status(201).json({
      success: true,
      data: teamMember
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/team
 * @desc    Get all team members
 * @access  Private
 */
const getTeamMembers = async (req, res, next) => {
  try {
    const teamMembers = await teamService.getTeamMembers(req.user.organizationId);

    res.json({
      success: true,
      data: teamMembers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/team/:id
 * @desc    Update team member
 * @access  Private (PLANNER_OWNER only)
 */
const updateTeamMember = async (req, res, next) => {
  try {
    if (req.user.role !== 'PLANNER_OWNER') {
      return res.status(403).json({
        success: false,
        error: 'Only organization owners can update team members'
      });
    }

    const teamMember = await teamService.updateTeamMember(req.params.id, req.body);

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        error: 'Team member not found'
      });
    }

    res.json({
      success: true,
      data: teamMember
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/team/:id
 * @desc    Deactivate team member
 * @access  Private (PLANNER_OWNER only)
 */
const deactivateTeamMember = async (req, res, next) => {
  try {
    if (req.user.role !== 'PLANNER_OWNER') {
      return res.status(403).json({
        success: false,
        error: 'Only organization owners can deactivate team members'
      });
    }

    const teamMember = await teamService.deactivateTeamMember(req.params.id);

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        error: 'Team member not found'
      });
    }

    res.json({
      success: true,
      message: 'Team member deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/team/verify-invitation/:token
 * @desc    Verify invitation token
 * @access  Public
 */
const verifyInvitationToken = async (req, res, next) => {
  try {
    const invitationService = require('../services/invitationService');
    const user = await invitationService.verifyInvitationToken(req.params.token);

    res.json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
        organizationName: user.organizationId?.name
      }
    });
  } catch (error) {
    if (error.message === 'Invalid or expired invitation token') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
};

/**
 * @route   POST /api/team/accept-invitation
 * @desc    Accept invitation and set password
 * @access  Public
 */
const acceptInvitation = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Token and password are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters'
      });
    }

    const invitationService = require('../services/invitationService');
    const user = await invitationService.acceptInvitation(token, password);

    res.json({
      success: true,
      message: 'Invitation accepted successfully. You can now log in with your email and password.',
      data: {
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    if (error.message === 'Invalid or expired invitation token') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
};

module.exports = {
  createTeamMember,
  getTeamMembers,
  updateTeamMember,
  deactivateTeamMember,
  verifyInvitationToken,
  acceptInvitation
};
