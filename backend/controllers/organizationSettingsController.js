const Organization = require('../models/Organization');
const { DEFAULT_TASK_STATUSES } = require('../constants/taskStatuses');
const { sendErrorResponse, sendSuccessResponse } = require('../utils/responseHandler');

// @desc    Get organization task statuses
// @route   GET /api/organization/settings/task-statuses
// @access  Private
exports.getTaskStatuses = async (req, res) => {
    try {
        const organization = await Organization.findById(req.user.organizationId);

        if (!organization) {
            return sendErrorResponse(res, 'Organization not found', 404);
        }

        // If using default statuses or no custom statuses, return defaults
        if (organization.defaultTaskStatuses || !organization.taskStatuses || organization.taskStatuses.length === 0) {
            return sendSuccessResponse(res, DEFAULT_TASK_STATUSES);
        }

        sendSuccessResponse(res, organization.taskStatuses.sort((a, b) => a.order - b.order));
    } catch (error) {
        console.error('Get task statuses error:', error);
        sendErrorResponse(res, error.message);
    }
};

// @desc    Update all task statuses
// @route   PUT /api/organization/settings/task-statuses
// @access  Private (PLANNER_OWNER, PLANNER)
exports.updateTaskStatuses = async (req, res) => {
    try {
        const { taskStatuses } = req.body;

        if (!Array.isArray(taskStatuses)) {
            return sendErrorResponse(res, 'Task statuses must be an array', 400);
        }

        const organization = await Organization.findById(req.user.organizationId);

        if (!organization) {
            return sendErrorResponse(res, 'Organization not found', 404);
        }

        organization.taskStatuses = taskStatuses;
        organization.defaultTaskStatuses = false;
        await organization.save();

        sendSuccessResponse(res, organization.taskStatuses.sort((a, b) => a.order - b.order), 'Task statuses updated successfully');
    } catch (error) {
        console.error('Update task statuses error:', error);
        sendErrorResponse(res, error.message);
    }
};

// @desc    Add new task status
// @route   POST /api/organization/settings/task-statuses
// @access  Private (PLANNER_OWNER, PLANNER)
exports.addTaskStatus = async (req, res) => {
    try {
        const { value, label, color, bgColor, icon } = req.body;

        if (!value || !label) {
            return sendErrorResponse(res, 'Value and label are required', 400);
        }

        const organization = await Organization.findById(req.user.organizationId);

        if (!organization) {
            return sendErrorResponse(res, 'Organization not found', 404);
        }

        // If using defaults, copy them first
        if (organization.defaultTaskStatuses || !organization.taskStatuses || organization.taskStatuses.length === 0) {
            organization.taskStatuses = DEFAULT_TASK_STATUSES;
        }

        // Check if value already exists
        const exists = organization.taskStatuses.some(status => status.value === value);
        if (exists) {
            return sendErrorResponse(res, 'Status with this value already exists', 400);
        }

        // Add new status
        const newStatus = {
            value,
            label,
            color: color || '#64748B',
            bgColor: bgColor || '#F1F5F9',
            icon: icon || 'DocumentText',
            order: organization.taskStatuses.length + 1,
            isDefault: false
        };

        organization.taskStatuses.push(newStatus);
        organization.defaultTaskStatuses = false;
        await organization.save();

        sendSuccessResponse(res, organization.taskStatuses.sort((a, b) => a.order - b.order), 'Task status added successfully');
    } catch (error) {
        console.error('Add task status error:', error);
        sendErrorResponse(res, error.message);
    }
};

// @desc    Delete task status
// @route   DELETE /api/organization/settings/task-statuses/:value
// @access  Private (PLANNER_OWNER, PLANNER)
exports.deleteTaskStatus = async (req, res) => {
    try {
        const { value } = req.params;

        const organization = await Organization.findById(req.user.organizationId);

        if (!organization) {
            return sendErrorResponse(res, 'Organization not found', 404);
        }

        // Can't delete if using defaults
        if (organization.defaultTaskStatuses || !organization.taskStatuses || organization.taskStatuses.length === 0) {
            return sendErrorResponse(res, 'Cannot delete default task statuses. Please customize first.', 400);
        }

        // Find and remove status
        const statusIndex = organization.taskStatuses.findIndex(status => status.value === value);

        if (statusIndex === -1) {
            return sendErrorResponse(res, 'Status not found', 404);
        }

        // Check if any tasks use this status
        const Task = require('../models/Task');
        const tasksWithStatus = await Task.countDocuments({
            organizationId: req.user.organizationId,
            status: value
        });

        if (tasksWithStatus > 0) {
            return sendErrorResponse(res, `Cannot delete status. ${tasksWithStatus} task(s) are using this status.`, 400);
        }

        organization.taskStatuses.splice(statusIndex, 1);
        await organization.save();

        sendSuccessResponse(res, organization.taskStatuses.sort((a, b) => a.order - b.order), 'Task status deleted successfully');
    } catch (error) {
        console.error('Delete task status error:', error);
        sendErrorResponse(res, error.message);
    }
};

// @desc    Reset to default task statuses
// @route   POST /api/organization/settings/reset-task-statuses
// @access  Private (PLANNER_OWNER only)
exports.resetTaskStatuses = async (req, res) => {
    try {
        const organization = await Organization.findById(req.user.organizationId);

        if (!organization) {
            return sendErrorResponse(res, 'Organization not found', 404);
        }

        organization.taskStatuses = DEFAULT_TASK_STATUSES;
        organization.defaultTaskStatuses = true;
        await organization.save();

        sendSuccessResponse(res, DEFAULT_TASK_STATUSES, 'Task statuses reset to default successfully');
    } catch (error) {
        console.error('Reset task statuses error:', error);
        sendErrorResponse(res, error.message);
    }
};
