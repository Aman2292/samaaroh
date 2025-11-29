import React from 'react';
import { Clock, User, Calendar, Edit, Trash, Flag } from 'iconsax-react';
import Select from '../common/Select';

const TaskCard = ({ task, onStatusChange, onEdit, onDelete, canEdit, taskStatuses = [] }) => {
    const getPriorityColor = (priority) => {
        const colors = {
            low: 'bg-blue-100 text-blue-700',
            medium: 'bg-yellow-100 text-yellow-700',
            high: 'bg-orange-100 text-orange-700',
            urgent: 'bg-red-100 text-red-700'
        };
        return colors[priority] || 'bg-gray-100 text-gray-700';
    };

    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

    const currentStatus = taskStatuses.find(s => s.value === task.status) || {
        label: task.status,
        bgColor: '#F1F5F9',
        color: '#64748B'
    };

    return (
        <div className={`bg-white rounded-lg border ${isOverdue ? 'border-red-300' : 'border-slate-200'} p-4 hover:shadow-md transition-shadow`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-slate-800 flex-1">{task.title}</h3>
                <div className="flex items-center gap-2 ml-2">
                    {canEdit && (
                        <>
                            <button
                                onClick={() => onEdit(task)}
                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                title="Edit task"
                            >
                                <Edit size="16" className="text-slate-600" />
                            </button>
                            <button
                                onClick={() => onDelete(task._id)}
                                className="p-1.5 hover:bg-red-50 rounded transition-colors"
                                title="Delete task"
                            >
                                <Trash size="16" className="text-red-600" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Description */}
            {task.description && (
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                    {task.description}
                </p>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {task.tags.map((tag, index) => (
                        <span
                            key={index}
                            className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mb-3">
                {/* Assigned To */}
                <div className="flex items-center gap-1.5">
                    <User size="16" />
                    <span>{task.assignedTo?.name || 'Unassigned'}</span>
                </div>

                {/* Due Date */}
                {task.dueDate && (
                    <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-600' : ''}`}>
                        <Calendar size="16" />
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                        {isOverdue && <span className="text-xs font-medium">(Overdue)</span>}
                    </div>
                )}

                {/* Priority */}
                <div className="flex items-center gap-1.5">
                    <Flag size="16" />
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                    </span>
                </div>
            </div>

            {/* Status Selector */}
            <div className="mt-3">
                {canEdit ? (
                    <Select
                        value={task.status}
                        onChange={(e) => onStatusChange(task._id, e.target.value)}
                        options={taskStatuses.map(status => ({
                            value: status.value,
                            label: status.label,
                            icon: status.icon,
                            bgColor: status.bgColor,
                            textColor: status.color
                        }))}
                        className="w-full"
                    />
                ) : (
                    <span
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium"
                        style={{ backgroundColor: currentStatus.bgColor, color: currentStatus.color }}
                    >
                        {currentStatus.label}
                    </span>
                )}
            </div>
        </div>
    );
};

export default TaskCard;
