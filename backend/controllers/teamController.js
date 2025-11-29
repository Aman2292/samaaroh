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

/**
 * @route   POST /api/team/import-csv
 * @desc    Import team members from CSV
 * @access  Private (PLANNER_OWNER, PLANNER)
 */
const importCSV = async (req, res, next) => {
  try {
    const multer = require('multer');
    const csv = require('csv-parser');
    const fs = require('fs');
    const path = require('path');

    // Set up multer for file upload
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
      },
      filename: (req, file, cb) => {
        cb(null, `team-import-${Date.now()}.csv`);
      }
    });

    const upload = multer({ storage }).single('file');

    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: 'File upload failed'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const results = [];
      const errors = [];
      const imported = [];

      // Read CSV file
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          // Process each row
          for (let i = 0; i < results.length; i++) {
            const row = results[i];
            const rowNum = i + 2; // Account for header row

            try {
              // Validate required fields
              if (!row.name || !row.email || !row.role) {
                errors.push({
                  row: rowNum,
                  email: row.email || 'N/A',
                  error: 'Missing required fields (name, email, role)'
                });
                continue;
              }

              // Validate role
              const validRoles = ['PLANNER', 'VENDOR', 'FINANCE'];
              if (!validRoles.includes(row.role.toUpperCase())) {
                errors.push({
                  row: rowNum,
                  email: row.email,
                  error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
                });
                continue;
              }

              // Create team member
              const teamMemberData = {
                name: row.name.trim(),
                email: row.email.trim().toLowerCase(),
                role: row.role.toUpperCase(),
                phone: row.phone?.trim() || '',
                designation: row.designation?.trim() || ''
              };

              const teamMember = await teamService.createTeamMember(
                teamMemberData,
                req.user._id,
                req.user.organizationId
              );

              imported.push({
                name: teamMember.name,
                email: teamMember.email,
                role: teamMember.role
              });
            } catch (error) {
              errors.push({
                row: rowNum,
                email: row.email,
                error: error.message || 'Failed to create team member'
              });
            }
          }

          // Delete uploaded file
          fs.unlinkSync(req.file.path);

          res.json({
            success: true,
            data: {
              imported,
              errors,
              total: results.length,
              successful: imported.length,
              failed: errors.length
            }
          });
        });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/team/export-csv
 * @desc    Export team members to CSV
 * @access  Private (PLANNER_OWNER, PLANNER)
 */
const exportCSV = async (req, res, next) => {
  try {
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    const fs = require('fs');
    const path = require('path');

    const teamMembers = await teamService.getTeamMembers(req.user.organizationId);

    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `team-export-${Date.now()}.csv`;
    const filepath = path.join(uploadsDir, filename);

    const csvWriter = createCsvWriter({
      path: filepath,
      header: [
        { id: 'name', title: 'name' },
        { id: 'email', title: 'email' },
        { id: 'role', title: 'role' },
        { id: 'phone', title: 'phone' },
        { id: 'designation', title: 'designation' },
        { id: 'status', title: 'status' }
      ]
    });

    const records = teamMembers.map(member => ({
      name: member.name,
      email: member.email,
      role: member.role,
      phone: member.phone || '',
      designation: member.designation || '',
      status: member.isActive ? 'active' : 'inactive'
    }));

    await csvWriter.writeRecords(records);

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
      // Delete file after download
      fs.unlinkSync(filepath);
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/team/csv-template
 * @desc    Download CSV template
 * @access  Private (PLANNER_OWNER, PLANNER)
 */
const downloadCSVTemplate = async (req, res, next) => {
  try {
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    const fs = require('fs');
    const path = require('path');

    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = 'team-import-template.csv';
    const filepath = path.join(uploadsDir, filename);

    const csvWriter = createCsvWriter({
      path: filepath,
      header: [
        { id: 'name', title: 'name' },
        { id: 'email', title: 'email' },
        { id: 'role', title: 'role' },
        { id: 'phone', title: 'phone' },
        { id: 'designation', title: 'designation' }
      ]
    });

    // Write empty template with sample row
    await csvWriter.writeRecords([
      {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'PLANNER',
        phone: '+1234567890',
        designation: 'Senior Planner'
      }
    ]);

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
      fs.unlinkSync(filepath);
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTeamMember,
  getTeamMembers,
  updateTeamMember,
  deactivateTeamMember,
  verifyInvitationToken,
  acceptInvitation,
  importCSV,
  exportCSV,
  downloadCSVTemplate
};
