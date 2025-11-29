const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: [true, 'Event is required']
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Assignee is required']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    status: {
        type: String,
        default: 'todo',
        trim: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    dueDate: {
        type: Date
    },
    tags: [{
        type: String,
        trim: true
    }],
    attachments: [{
        type: String
    }],
    completedAt: {
        type: Date
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

// Indexes for better query performance
taskSchema.index({ organizationId: 1, eventId: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ dueDate: 1 });

// Virtual for checking if task is overdue
taskSchema.virtual('isOverdue').get(function() {
    if (!this.dueDate || this.status === 'completed') return false;
    return new Date() > this.dueDate;
});

// Method to mark task as completed
taskSchema.methods.markComplete = function() {
    this.status = 'completed';
    this.completedAt = new Date();
    return this.save();
};

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
