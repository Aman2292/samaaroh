import React, { useState, useEffect } from 'react';
import { CloseCircle, User, Call, Sms, Briefcase, TaskSquare, Add, Clock, Flag } from 'iconsax-react';
import TaskModal from '../Tasks/TaskModal';
import { toast } from 'react-toastify';

const MemberProfileModal = ({ isOpen, onClose, member, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('details');
    const [tasks, setTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [events, setEvents] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        if (isOpen && member) {
            fetchMemberTasks();
            fetchEvents();
            fetchTeamMembers();
        }
    }, [isOpen, member]);

    const fetchMemberTasks = async () => {
        try {
            setLoadingTasks(true);
            const response = await fetch(`https://samaaroh-1.onrender.com/api/tasks?assignedTo=${member._id}`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setTasks(data.data.tasks || []);
            }
        } catch (error) {
            console.error('Failed to fetch tasks', error);
        } finally {
            setLoadingTasks(false);
        }
    };

    const fetchEvents = async () => {
        try {
            const response = await fetch('https://samaaroh-1.onrender.com/api/events?limit=100', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await response.json();
            if (response.ok) setEvents(data.data || []);
        } catch (error) {
            console.error('Failed to fetch events');
        }
    };

    const fetchTeamMembers = async () => {
        try {
            const response = await fetch('https://samaaroh-1.onrender.com/api/team', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await response.json();
            if (response.ok) setTeamMembers(data.data || []);
        } catch (error) {
            console.error('Failed to fetch team members');
        }
    };

    const handleTaskSuccess = () => {
        fetchMemberTasks();
        setShowTaskModal(false);
    };

    if (!isOpen || !member) return null;

    const getRoleBadge = (role) => {
        const roleConfig = {
            PLANNER_OWNER: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Owner' },
            PLANNER: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Planner' },
            FINANCE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Finance' },
            VENDOR: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Vendor' }
        };

        const config = roleConfig[role] || roleConfig.PLANNER;
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'in_progress': return 'bg-yellow-100 text-yellow-700';
            case 'todo': return 'bg-slate-100 text-slate-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-2xl font-bold border-4 border-white shadow-sm">
                            {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">{member.name}</h2>
                            <div className="flex items-center space-x-2 mt-1">
                                {getRoleBadge(member.role)}
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${member.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {member.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <CloseCircle size="28" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-6">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'details' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <User size="18" />
                        Details
                    </button>
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'tasks' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <TaskSquare size="18" />
                        Tasks
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">
                            {tasks.length}
                        </span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {activeTab === 'details' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">Contact Information</h3>
                                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                                    <Sms size="20" className="text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">Email Address</p>
                                        <p className="text-slate-700 font-medium">{member.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                                    <Call size="20" className="text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">Phone Number</p>
                                        <p className="text-slate-700 font-medium">{member.phone || 'Not provided'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">Work Information</h3>
                                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                                    <Briefcase size="20" className="text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">Role</p>
                                        <p className="text-slate-700 font-medium capitalize">{member.role.replace('_', ' ').toLowerCase()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                                    <Clock size="20" className="text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">Joined On</p>
                                        <p className="text-slate-700 font-medium">{new Date(member.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-slate-800">Assigned Tasks</h3>
                                <button
                                    onClick={() => setShowTaskModal(true)}
                                    className="flex items-center space-x-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                                >
                                    <Add size="16" />
                                    <span>Assign Task</span>
                                </button>
                            </div>

                            {loadingTasks ? (
                                <div className="text-center py-8 text-slate-500">Loading tasks...</div>
                            ) : tasks.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <TaskSquare size="48" className="mx-auto mb-3 text-slate-300" variant="Bulk" />
                                    <p className="text-slate-500">No tasks assigned yet</p>
                                    <button
                                        onClick={() => setShowTaskModal(true)}
                                        className="mt-2 text-primary-600 font-medium hover:underline"
                                    >
                                        Assign first task
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {tasks.map(task => (
                                        <div key={task._id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow flex justify-between items-center group">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${getPriorityColor(task.priority)}`}>
                                                        {task.priority}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusColor(task.status)}`}>
                                                        {task.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <h4 className="text-slate-800 font-medium">{task.title}</h4>
                                                {task.dueDate && (
                                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                        <Clock size="12" />
                                                        Due: {new Date(task.dueDate).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-500">
                                                    {task.eventId ? `Event: ${task.eventId.eventName}` : task.venueId ? 'Venue Task' : 'General Task'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {showTaskModal && (
                <TaskModal
                    isOpen={showTaskModal}
                    onClose={() => setShowTaskModal(false)}
                    initialData={{ assignedTo: member._id }}
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
        </div>
    );
};

export default MemberProfileModal;
