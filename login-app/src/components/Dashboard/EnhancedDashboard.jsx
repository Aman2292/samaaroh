import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, MoneyRecive, People, Add, Notification, Task, DocumentText } from 'iconsax-react';
import { toast } from 'react-toastify';
import MetricCard from './MetricCard';
import RevenueChart from './RevenueChart';
import PaymentDonutChart from './PaymentDonutChart';
import EventsChart from './EventsChart';
import SendNotificationModal from '../Notifications/SendNotificationModal';
import { format } from 'date-fns';

const EnhancedDashboard = () => {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSendNotificationModalOpen, setIsSendNotificationModalOpen] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            console.log('Fetching dashboard data...', userInfo.token);
            const response = await fetch('http://localhost:5001/api/dashboard/stats', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Dashboard data received:', data);

            if (response.ok) {
                setDashboardData(data.data);
                console.log('Dashboard data set successfully');
            } else {
                console.error('API error:', data);
                toast.error(data.error || 'Failed to fetch dashboard data');
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            toast.error('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-slate-200 rounded w-64 mb-8"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const quickActions = [
        {
            label: 'Create Event',
            icon: Calendar,
            color: 'bg-green-500 hover:bg-green-600',
            action: () => navigate('/events/create')
        },
        {
            label: 'Add Client',
            icon: User,
            color: 'bg-blue-500 hover:bg-blue-600',
            action: () => navigate('/clients')
        },
        {
            label: 'Add Team Member',
            icon: People,
            color: 'bg-purple-500 hover:bg-purple-600',
            action: () => navigate('/team')
        },
        {
            label: 'Create Task',
            icon: Task,
            color: 'bg-orange-500 hover:bg-orange-600',
            action: () => navigate('/tasks')
        },
        {
            label: 'Record Payment',
            icon: MoneyRecive,
            color: 'bg-indigo-500 hover:bg-indigo-600',
            action: () => navigate('/payments/outstanding')
        },
        {
            label: 'Send Notification',
            icon: Notification,
            color: 'bg-pink-500 hover:bg-pink-600',
            action: () => setIsSendNotificationModalOpen(true)
        }
    ];

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-slate-500 mt-1">Welcome back, {userInfo.name}!</p>
                <p className="text-sm text-slate-400">{format(new Date(), 'EEEE, MMMM dd, yyyy')}</p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                    title="Total Clients"
                    value={dashboardData?.metrics?.totalClients?.value || 0}
                    change={dashboardData?.metrics?.totalClients?.change}
                    icon={User}
                    color="primary"
                    onClick={() => navigate('/clients')}
                />
                <MetricCard
                    title="Active Events"
                    value={dashboardData?.metrics?.activeEvents?.value || 0}
                    change={dashboardData?.metrics?.activeEvents?.change}
                    icon={Calendar}
                    color="success"
                    onClick={() => navigate('/events')}
                />
                <MetricCard
                    title="Pending Payments"
                    value={dashboardData?.metrics?.pendingPayments?.value || 0}
                    change={dashboardData?.metrics?.pendingPayments?.change}
                    icon={MoneyRecive}
                    color="warning"
                    prefix="₹"
                    onClick={() => navigate('/payments/outstanding')}
                />
                <MetricCard
                    title="Team Members"
                    value={dashboardData?.metrics?.teamMembers?.value || 0}
                    change={dashboardData?.metrics?.teamMembers?.change}
                    icon={People}
                    color="info"
                    onClick={() => navigate('/team')}
                />
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {quickActions.map((action, index) => {
                        const ActionIcon = action.icon;
                        return (
                            <button
                                key={index}
                                onClick={action.action}
                                className={`flex flex-col items-center justify-center space-y-2 p-4 rounded-lg text-white transition-all transform hover:scale-105 ${action.color}`}
                            >
                                <ActionIcon size={28} variant="Bold" color="#ffffff" />
                                <span className="text-sm font-medium text-center">{action.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <RevenueChart data={dashboardData?.charts?.revenue || []} />
                <PaymentDonutChart data={dashboardData?.charts?.payments || { paid: 0, pending: 0, overdue: 0 }} />
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <EventsChart data={dashboardData?.charts?.events || { byStatus: {}, byType: {} }} />

                {/* Task Overview */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Task Overview</h3>
                    <div className="space-y-3">
                        {[
                            { label: 'To Do', value: dashboardData?.charts?.tasks?.todo || 0, color: 'bg-blue-500' },
                            { label: 'In Progress', value: dashboardData?.charts?.tasks?.in_progress || 0, color: 'bg-orange-500' },
                            { label: 'Completed', value: dashboardData?.charts?.tasks?.completed || 0, color: 'bg-green-500' },
                            { label: 'Overdue', value: dashboardData?.charts?.tasks?.overdue || 0, color: 'bg-red-500' }
                        ].map((task, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full ${task.color}`}></div>
                                    <span className="text-slate-700 font-medium">{task.label}</span>
                                </div>
                                <span className="text-2xl font-bold text-slate-800">{task.value}</span>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => navigate('/tasks')}
                        className="w-full mt-4 py-2 border-2 border-primary-200 text-primary-700 rounded-lg hover:bg-primary-50 transition-colors font-medium"
                    >
                        View All Tasks
                    </button>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h3>
                {dashboardData?.recentActivity?.length > 0 ? (
                    <div className="space-y-4">
                        {dashboardData.recentActivity.map((activity, index) => (
                            <div key={index} className="flex items-start space-x-3 pb-4 border-b border-slate-100 last:border-0">
                                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Calendar size="20" className="text-primary-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-slate-800 font-medium">{activity.eventName}</p>
                                    <p className="text-sm text-slate-500">
                                        Created by {activity.createdBy?.name || 'Unknown'} • {format(new Date(activity.createdAt), 'MMM dd, yyyy')}
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${activity.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                    activity.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                                        'bg-slate-100 text-slate-700'
                                    }`}>
                                    {activity.status}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-400">
                        <DocumentText size="48" className="mx-auto mb-2" />
                        <p>No recent activity</p>
                    </div>
                )}
            </div>

            {/* Send Notification Modal */}
            <SendNotificationModal
                isOpen={isSendNotificationModalOpen}
                onClose={() => setIsSendNotificationModalOpen(false)}
            />
        </div>
    );
};

export default EnhancedDashboard;
