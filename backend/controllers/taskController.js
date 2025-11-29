const Task = require('../models/Task');
const Event = require('../models/Event');
const User = require('../models/User');
const { sendErrorResponse, sendSuccessResponse } = require('../utils/responseHandler');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (PLANNER_OWNER, PLANNER)
exports.createTask = async (req, res) => {
    try {
        const { title, description, eventId, assignedTo, status, priority, dueDate, tags, notes } = req.body;

        // Validate event exists and belongs to organization
        const event = await Event.findById(eventId);
        if (!event || event.organizationId.toString() !== req.user.organizationId.toString()) {
            return sendErrorResponse(res, 'Event not found', 404);
        }

        // Validate assignee exists and belongs to organization
        const assignee = await User.findById(assignedTo);
        if (!assignee || assignee.organizationId.toString() !== req.user.organizationId.toString()) {
            return sendErrorResponse(res, 'Assignee not found', 404);
        }

        const task = await Task.create({
            title,
            description,
            eventId,
            assignedTo,
            createdBy: req.user._id,
            organizationId: req.user.organizationId,
            status: status || 'todo',
            priority: priority || 'medium',
            dueDate,
            tags,
            notes
        });

        await task.populate([
            { path: 'assignedTo', select: 'name email role' },
            { path: 'createdBy', select: 'name email' },
            { path: 'eventId', select: 'eventName eventDate' }
        ]);

        sendSuccessResponse(res, task, 'Task created successfully', 201);
    } catch (error) {
        console.error('Create task error:', error);
        sendErrorResponse(res, error.message);
    }
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
    try {
        const { eventId, assignedTo, status, priority, page = 1, limit = 20 } = req.query;

        // Build query
        const query = { organizationId: req.user.organizationId };

        // Filters
        if (eventId) query.eventId = eventId;
        if (status) query.status = status;
        if (priority) query.priority = priority;

        // Role-based filtering
        if (req.user.role === 'VENDOR' || req.user.role === 'FINANCE') {
            // Only show tasks assigned to them
            query.assignedTo = req.user._id;
        } else if (assignedTo) {
            query.assignedTo = assignedTo;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const tasks = await Task.find(query)
            .populate('assignedTo', 'name email role')
            .populate('createdBy', 'name email')
            .populate('eventId', 'eventName eventDate clientId')
            .sort({ dueDate: 1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Task.countDocuments(query);

        const pagination = {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        };

        sendSuccessResponse(res, { tasks, pagination });
    } catch (error) {
        console.error('Get tasks error:', error);
        sendErrorResponse(res, error.message);
    }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignedTo', 'name email role phone')
            .populate('createdBy', 'name email')
            .populate('eventId', 'eventName eventDate venue clientId');

        if (!task) {
            return sendErrorResponse(res, 'Task not found', 404);
        }

        // Check organization
        if (task.organizationId.toString() !== req.user.organizationId.toString()) {
            return sendErrorResponse(res, 'Not authorized', 403);
        }

        // Role-based access
        if ((req.user.role === 'VENDOR' || req.user.role === 'FINANCE') &&
            task.assignedTo._id.toString() !== req.user._id.toString()) {
            return sendErrorResponse(res, 'Not authorized to view this task', 403);
        }

        sendSuccessResponse(res, task);
    } catch (error) {
        console.error('Get task error:', error);
        sendErrorResponse(res, error.message);
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private (PLANNER_OWNER, PLANNER, or task creator)
exports.updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return sendErrorResponse(res, 'Task not found', 404);
        }

        // Check organization
        if (task.organizationId.toString() !== req.user.organizationId.toString()) {
            return sendErrorResponse(res, 'Not authorized', 403);
        }

        // Check permissions
        const canEdit = ['PLANNER_OWNER', 'PLANNER'].includes(req.user.role) ||
            task.createdBy.toString() === req.user._id.toString();

        if (!canEdit) {
            return sendErrorResponse(res, 'Not authorized to edit this task', 403);
        }

        const { title, description, assignedTo, status, priority, dueDate, tags, notes } = req.body;

        // Update fields
        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (assignedTo !== undefined) task.assignedTo = assignedTo;
        if (status !== undefined) {
            task.status = status;
            if (status === 'completed' && !task.completedAt) {
                task.completedAt = new Date();
            }
        }
        if (priority !== undefined) task.priority = priority;
        if (dueDate !== undefined) task.dueDate = dueDate;
        if (tags !== undefined) task.tags = tags;
        if (notes !== undefined) task.notes = notes;

        await task.save();

        await task.populate([
            { path: 'assignedTo', select: 'name email role' },
            { path: 'createdBy', select: 'name email' },
            { path: 'eventId', select: 'eventName eventDate' }
        ]);

        sendSuccessResponse(res, task, 'Task updated successfully');
    } catch (error) {
        console.error('Update task error:', error);
        sendErrorResponse(res, error.message);
    }
};

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Private (Assigned user or PLANNER_OWNER/PLANNER)
exports.updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!status) {
            return sendErrorResponse(res, 'Status is required', 400);
        }

        const task = await Task.findById(req.params.id);

        if (!task) {
            return sendErrorResponse(res, 'Task not found', 404);
        }

        // Check organization
        if (task.organizationId.toString() !== req.user.organizationId.toString()) {
            return sendErrorResponse(res, 'Not authorized', 403);
        }

        // Check permissions
        const canUpdate = ['PLANNER_OWNER', 'PLANNER'].includes(req.user.role) ||
            task.assignedTo.toString() === req.user._id.toString();

        if (!canUpdate) {
            return sendErrorResponse(res, 'Not authorized to update this task', 403);
        }

        task.status = status;
        if (status === 'completed' && !task.completedAt) {
            task.completedAt = new Date();
        }

        await task.save();

        await task.populate([
            { path: 'assignedTo', select: 'name email role' },
            { path: 'eventId', select: 'eventName eventDate' }
        ]);

        sendSuccessResponse(res, task, 'Task status updated successfully');
    } catch (error) {
        console.error('Update task status error:', error);
        sendErrorResponse(res, error.message);
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (PLANNER_OWNER, PLANNER, or task creator)
exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return sendErrorResponse(res, 'Task not found', 404);
        }

        // Check organization
        if (task.organizationId.toString() !== req.user.organizationId.toString()) {
            return sendErrorResponse(res, 'Not authorized', 403);
        }

        // Check permissions
        const canDelete = req.user.role === 'PLANNER_OWNER' ||
            (req.user.role === 'PLANNER' && task.createdBy.toString() === req.user._id.toString());

        if (!canDelete) {
            return sendErrorResponse(res, 'Not authorized to delete this task', 403);
        }

        await task.deleteOne();

        sendSuccessResponse(res, null, 'Task deleted successfully');
    } catch (error) {
        console.error('Delete task error:', error);
        sendErrorResponse(res, error.message);
    }
};

// @desc    Get task statistics
// @route   GET /api/tasks/stats
// @access  Private
exports.getTaskStats = async (req, res) => {
    try {
        const { eventId } = req.query;

        const query = { organizationId: req.user.organizationId };
        if (eventId) query.eventId = eventId;

        // Role-based filtering
        if (req.user.role === 'VENDOR' || req.user.role === 'FINANCE') {
            query.assignedTo = req.user._id;
        }

        const stats = await Task.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const overdueTasks = await Task.countDocuments({
            ...query,
            dueDate: { $lt: new Date() },
            status: { $nin: ['completed', 'cancelled'] }
        });

        const totalTasks = await Task.countDocuments(query);

        const statusCounts = stats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {});

        sendSuccessResponse(res, {
            total: totalTasks,
            byStatus: statusCounts,
            overdue: overdueTasks
        });
    } catch (error) {
        console.error('Get task stats error:', error);
        sendErrorResponse(res, error.message);
    }
};
