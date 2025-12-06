import React, { useState, useEffect } from 'react';
import { TaskSquare, Add, Filter, SearchNormal1, Calendar, User, Building, Flag, TickCircle } from 'iconsax-react';
import TaskModal from '../../components/Tasks/TaskModal';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';
import { toast } from 'react-toastify';

const TasksPage = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);

    // Filter states
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Data for modal
    const [events, setEvents] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [venues, setVenues] = useState([]);

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        fetchTasks();
        fetchAuxiliaryData();
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5001/api/tasks', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setTasks(data.data.tasks || []);
            } else {
                setError(data.error || 'Failed to fetch tasks');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const fetchAuxiliaryData = async () => {
        try {
            const [eventsRes, teamRes, venuesRes] = await Promise.all([
                fetch('http://localhost:5001/api/events?limit=100', { headers: { 'Authorization': `Bearer ${userInfo.token}` } }),
                fetch('http://localhost:5001/api/team', { headers: { 'Authorization': `Bearer ${userInfo.token}` } }),
                fetch('http://localhost:5001/api/venue', { headers: { 'Authorization': `Bearer ${userInfo.token}` } })
            ]);

            if (eventsRes.ok) {
                const data = await eventsRes.json();
                setEvents(data.data || []);
            }
            if (teamRes.ok) {
                const data = await teamRes.json();
                setTeamMembers(data.data || []);
            }
            if (venuesRes.ok) {
                const data = await venuesRes.json();
                setVenues(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch auxiliary data');
        }
    };

    const handleDeleteClick = (task) => {
        setTaskToDelete(task);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!taskToDelete) return;
        try {
            const response = await fetch(`http://localhost:5001/api/tasks/${taskToDelete._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            if (response.ok) {
                toast.success('Task deleted successfully');
                fetchTasks();
            } else {
                toast.error('Failed to delete task');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setDeleteModalOpen(false);
            setTaskToDelete(null);
        }
    };

    const handleTaskSuccess = () => {
        fetchTasks();
        setShowTaskModal(false);
        setSelectedTask(null);
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-700';
            case 'high': return 'bg-orange-100 text-orange-700';
            case 'medium': return 'bg-blue-100 text-blue-700';
            case 'low': return 'bg-slate-100 text-slate-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            todo: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'To Do' },
            in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'In Progress' },
            completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' }
        };
        const style = config[status] || config.todo;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                {style.label}
            </span>
        );
    };

    const filteredTasks = tasks.filter(task => {
        const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
        const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesPriority && matchesSearch;
    });

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Global Tasks</h1>
                        <p className="text-slate-500 mt-1">Manage all tasks across events and venues</p>
                    </div>
                    <button
                        onClick={() => {
                            setSelectedTask(null);
                            setShowTaskModal(true);
                        }}
                        className="flex items-center space-x-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-md shadow-primary-200"
                    >
                        <Add size="20" color="#FFFFFF" />
                        <span>Create Task</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <SearchNormal1 size="20" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter size="20" className="text-slate-400" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">All Status</option>
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                            <select
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value)}
                                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">All Priorities</option>
                                <option value="urgent">Urgent</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <LoadingSkeleton type="table" count={5} />
                ) : error ? (
                    <ErrorMessage message={error} onRetry={fetchTasks} />
                ) : filteredTasks.length === 0 ? (
                    <EmptyState
                        icon={TaskSquare}
                        title="No tasks found"
                        description="Create tasks to track work across your organization."
                        actionLabel="+ Create First Task"
                        onAction={() => setShowTaskModal(true)}
                    />
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Task</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Context</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Assignee</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Due Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTasks.map((task) => (
                                    <tr key={task._id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${task.priority === 'urgent' ? 'bg-red-500' :
                                                        task.priority === 'high' ? 'bg-orange-500' :
                                                            task.priority === 'medium' ? 'bg-blue-500' : 'bg-slate-400'
                                                    }`} />
                                                <div>
                                                    <div className="font-medium text-slate-800">{task.title}</div>
                                                    <div className="text-xs text-slate-500 line-clamp-1">{task.description}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {task.eventId ? (
                                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                    <Calendar size="16" className="text-primary-500" />
                                                    <span className="truncate max-w-[150px]" title={task.eventId.eventName}>
                                                        {task.eventId.eventName}
                                                    </span>
                                                </div>
                                            ) : task.venueId ? (
                                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                    <Building size="16" className="text-purple-500" />
                                                    <span>Venue Task</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                                    <Flag size="16" />
                                                    <span>General</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                                                    {task.assignedTo?.name?.charAt(0) || '?'}
                                                </div>
                                                <span className="text-sm text-slate-600">{task.assignedTo?.name || 'Unassigned'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {task.dueDate ? (
                                                <div className={`text-sm ${new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                                                    {new Date(task.dueDate).toLocaleDateString()}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(task.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTask(task);
                                                        setShowTaskModal(true);
                                                    }}
                                                    className="text-slate-400 hover:text-primary-600 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(task)}
                                                    className="text-slate-400 hover:text-red-600 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {showTaskModal && (
                    <TaskModal
                        isOpen={showTaskModal}
                        onClose={() => {
                            setShowTaskModal(false);
                            setSelectedTask(null);
                        }}
                        task={selectedTask}
                        events={events}
                        teamMembers={teamMembers}
                        taskStatuses={[
                            { value: 'todo', label: 'To Do', color: '#64748b', bgColor: '#f1f5f9' },
                            { value: 'in_progress', label: 'In Progress', color: '#eab308', bgColor: '#fef9c3' },
                            { value: 'completed', label: 'Completed', color: '#22c55e', bgColor: '#dcfce7' }
                        ]}
                        onSuccess={handleTaskSuccess}
                    />
                )}

                <DeleteConfirmationModal
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Task"
                    message="Are you sure you want to delete this task? This action cannot be undone."
                />
            </div>
        </div>
    );
};

export default TasksPage;
