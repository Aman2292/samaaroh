import React, { useState, useEffect } from 'react';
import { Add, FilterSearch, Calendar, User } from 'iconsax-react';
import TaskCard from '../../components/Tasks/TaskCard';
import TaskModal from '../../components/Tasks/TaskModal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import Select from '../../components/common/Select';
import { toast } from 'react-toastify';

const TasksPage = () => {
    const [tasks, setTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [events, setEvents] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [taskStatuses, setTaskStatuses] = useState([]);

    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [eventFilter, setEventFilter] = useState('');
    const [assigneeFilter, setAssigneeFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
    const canManageTasks = ['PLANNER_OWNER', 'PLANNER'].includes(userInfo.role);

    useEffect(() => {
        fetchTasks();
        fetchEvents();
        fetchTeamMembers();
        fetchTaskStatuses();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [tasks, statusFilter, eventFilter, assigneeFilter, priorityFilter]);

    const fetchTasks = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/tasks', {
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                setTasks(data.data.tasks || []);
            } else {
                toast.error(data.error || 'Failed to fetch tasks');
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const fetchEvents = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/events?page=1&limit=100', {
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                setEvents(data.data.events || []);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const fetchTeamMembers = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/team', {
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                setTeamMembers(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching team members:', error);
        }
    };

    const fetchTaskStatuses = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/organization/settings/task-statuses', {
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                setTaskStatuses(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching task statuses:', error);
        }
    };

    const applyFilters = () => {
        let filtered = [...tasks];

        if (statusFilter) {
            filtered = filtered.filter(task => task.status === statusFilter);
        }

        if (eventFilter) {
            filtered = filtered.filter(task => task.eventId?._id === eventFilter);
        }

        if (assigneeFilter) {
            filtered = filtered.filter(task => task.assignedTo?._id === assigneeFilter);
        }

        if (priorityFilter) {
            filtered = filtered.filter(task => task.priority === priorityFilter);
        }

        setFilteredTasks(filtered);
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            const response = await fetch(`http://localhost:5001/api/tasks/${taskId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                toast.success('Task status updated');
                fetchTasks();
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating task status:', error);
            toast.error('Failed to connect to server');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;

        try {
            const response = await fetch(`http://localhost:5001/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                }
            });

            if (response.ok) {
                toast.success('Task deleted successfully');
                fetchTasks();
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to delete task');
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            toast.error('Failed to connect to server');
        }
    };

    const handleEditTask = (task) => {
        setSelectedTask(task);
        setShowTaskModal(true);
    };

    const handleCloseModal = () => {
        setShowTaskModal(false);
        setSelectedTask(null);
    };

    const handleTaskSuccess = () => {
        fetchTasks();
        handleCloseModal();
    };

    const clearFilters = () => {
        setStatusFilter('');
        setEventFilter('');
        setAssigneeFilter('');
        setPriorityFilter('');
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <LoadingSkeleton />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Tasks</h1>
                    <p className="text-slate-600 mt-1">Manage and track all your event tasks</p>
                </div>
                {canManageTasks && (
                    <button
                        onClick={() => setShowTaskModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Add size="20" />
                        <span>Create Task</span>
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <FilterSearch size="20" className="text-slate-600" />
                    <h3 className="font-medium text-slate-800">Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        options={[
                            { value: '', label: 'All Statuses' },
                            ...taskStatuses.map(status => ({
                                value: status.value,
                                label: status.label,
                                icon: status.icon,
                                bgColor: status.bgColor,
                                textColor: status.color
                            }))
                        ]}
                        placeholder="Filter by status"
                    />

                    <Select
                        value={eventFilter}
                        onChange={(e) => setEventFilter(e.target.value)}
                        options={[
                            { value: '', label: 'All Events' },
                            ...events.map(event => ({
                                value: event._id,
                                label: event.eventName
                            }))
                        ]}
                        placeholder="Filter by event"
                    />

                    <Select
                        value={assigneeFilter}
                        onChange={(e) => setAssigneeFilter(e.target.value)}
                        options={[
                            { value: '', label: 'All Assignees' },
                            ...teamMembers.map(member => ({
                                value: member._id,
                                label: member.name
                            }))
                        ]}
                        placeholder="Filter by assignee"
                    />

                    <Select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        options={[
                            { value: '', label: 'All Priorities' },
                            { value: 'low', label: 'Low' },
                            { value: 'medium', label: 'Medium' },
                            { value: 'high', label: 'High' },
                            { value: 'urgent', label: 'Urgent' }
                        ]}
                        placeholder="Filter by priority"
                    />
                </div>
                {(statusFilter || eventFilter || assigneeFilter || priorityFilter) && (
                    <div className="mt-4">
                        <button
                            onClick={clearFilters}
                            className="text-sm text-primary-600 hover:text-primary-700"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>

            {/* Task Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                    <p className="text-sm text-slate-600 mb-1">Total Tasks</p>
                    <p className="text-2xl font-bold text-slate-800">{filteredTasks.length}</p>
                </div>
                {taskStatuses.slice(0, 3).map(status => {
                    const count = filteredTasks.filter(t => t.status === status.value).length;
                    return (
                        <div key={status.value} className="bg-white rounded-lg border border-slate-200 p-4">
                            <p className="text-sm text-slate-600 mb-1">{status.label}</p>
                            <p className="text-2xl font-bold" style={{ color: status.color }}>{count}</p>
                        </div>
                    );
                })}
            </div>

            {/* Tasks Grid */}
            {filteredTasks.length === 0 ? (
                <EmptyState
                    title="No tasks found"
                    message={
                        canManageTasks
                            ? "Get started by creating your first task"
                            : "No tasks have been assigned to you yet"
                    }
                    actionLabel={canManageTasks ? "Create Task" : null}
                    onAction={() => setShowTaskModal(true)}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTasks.map(task => (
                        <TaskCard
                            key={task._id}
                            task={task}
                            onStatusChange={handleStatusChange}
                            onEdit={handleEditTask}
                            onDelete={handleDeleteTask}
                            canEdit={canManageTasks || task.assignedTo?._id === userInfo._id}
                            taskStatuses={taskStatuses}
                        />
                    ))}
                </div>
            )}

            {/* Task Modal */}
            <TaskModal
                isOpen={showTaskModal}
                onClose={handleCloseModal}
                task={selectedTask}
                events={events}
                teamMembers={teamMembers}
                taskStatuses={taskStatuses}
                onSuccess={handleTaskSuccess}
            />
        </div>
    );
};

export default TasksPage;
