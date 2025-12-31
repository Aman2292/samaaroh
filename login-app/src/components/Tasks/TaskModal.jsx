import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CloseCircle } from 'iconsax-react';
import Select from '../common/Select';
import DatePicker from '../common/DatePicker';
import { toast } from 'react-toastify';
import PrimaryButton from '../common/PrimaryButton';
import SecondaryButton from '../common/SecondaryButton';

const schema = yup.object().shape({
    title: yup.string().required('Title is required'),
    description: yup.string(),
    eventId: yup.string().when('venueId', {
        is: (venueId) => !venueId,
        then: () => yup.string().required('Event or Venue is required'),
        otherwise: () => yup.string().nullable()
    }),
    venueId: yup.string().nullable(),
    assignedTo: yup.string().required('Assignee is required'),
    status: yup.string().required('Status is required'),
    priority: yup.string().required('Priority is required'),
    dueDate: yup.date().nullable(),
    tags: yup.string(),
    notes: yup.string()
}, [['eventId', 'venueId']]);

const TaskModal = ({ isOpen, onClose, task, initialData, events, venueId, teamMembers, taskStatuses, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            title: '',
            description: '',
            eventId: '',
            venueId: '',
            assignedTo: '',
            status: 'todo',
            priority: 'medium',
            dueDate: null,
            tags: '',
            notes: ''
        }
    });

    useEffect(() => {
        if (task) {
            reset({
                title: task.title || '',
                description: task.description || '',
                eventId: task.eventId?._id || task.eventId || '',
                venueId: task.venueId || venueId || '',
                assignedTo: task.assignedTo?._id || task.assignedTo || '',
                status: task.status || 'todo',
                priority: task.priority || 'medium',
                dueDate: task.dueDate ? new Date(task.dueDate) : null,
                tags: task.tags?.join(', ') || '',
                notes: task.notes || ''
            });
        } else {
            reset({
                title: initialData?.title || '',
                description: initialData?.description || '',
                eventId: initialData?.eventId || '',
                venueId: initialData?.venueId || venueId || '',
                assignedTo: initialData?.assignedTo || '',
                status: initialData?.status || 'todo',
                priority: initialData?.priority || 'medium',
                dueDate: initialData?.dueDate ? new Date(initialData.dueDate) : null,
                tags: initialData?.tags || '',
                notes: initialData?.notes || ''
            });
        }
    }, [task, initialData, reset]);

    const onSubmit = async (data) => {
        try {
            setLoading(true);

            // Process tags
            const tags = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

            const taskData = {
                ...data,
                tags,
                dueDate: data.dueDate || null
            };

            const url = task
                ? `https://samaaroh-1.onrender.com/api/tasks/${task._id}`
                : 'https://samaaroh-1.onrender.com/api/tasks';

            const method = task ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify(taskData)
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(task ? 'Task updated successfully' : 'Task created successfully');
                onSuccess?.();
                onClose();
            } else {
                toast.error(result.error || 'Failed to save task');
            }
        } catch (error) {
            console.error('Error saving task:', error);
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const priorityOptions = [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800">
                        {task ? 'Edit Task' : 'Create New Task'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <CloseCircle size="24" color="#64748b" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            {...register('title')}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Enter task title"
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Description
                        </label>
                        <textarea
                            {...register('description')}
                            rows="3"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Enter task description"
                        />
                    </div>

                    {/* Event and Assignee */}
                    <div className="grid grid-cols-2 gap-4">
                        {events && events.length > 0 && (
                            <Select
                                label="Event"
                                name="eventId"
                                control={control}
                                error={errors.eventId}
                                required={!venueId}
                                options={events.map(event => ({
                                    value: event._id,
                                    label: event.eventName
                                }))}
                                placeholder="Select event"
                            />
                        )}

                        <Select
                            label="Assign To"
                            name="assignedTo"
                            control={control}
                            error={errors.assignedTo}
                            required
                            options={teamMembers.map(member => ({
                                value: member._id,
                                label: member.name
                            }))}
                            placeholder="Select assignee"
                        />
                    </div>

                    {/* Status and Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Status"
                            name="status"
                            control={control}
                            error={errors.status}
                            required
                            options={taskStatuses.map(status => ({
                                value: status.value,
                                label: status.label,
                                icon: status.icon,
                                bgColor: status.bgColor,
                                textColor: status.color
                            }))}
                        />

                        <Select
                            label="Priority"
                            name="priority"
                            control={control}
                            error={errors.priority}
                            required
                            options={priorityOptions}
                        />
                    </div>

                    {/* Due Date */}
                    <DatePicker
                        label="Due Date"
                        name="dueDate"
                        control={control}
                        error={errors.dueDate}
                    />

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Tags (comma separated)
                        </label>
                        <input
                            type="text"
                            {...register('tags')}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="e.g. setup, decorations, catering"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Notes
                        </label>
                        <textarea
                            {...register('notes')}
                            rows="2"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Additional notes"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                        <SecondaryButton
                            onClick={onClose}
                        >
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskModal;
