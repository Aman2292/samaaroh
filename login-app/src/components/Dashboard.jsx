import React, { useState, useEffect } from 'react';
import { Add, Notification } from 'iconsax-react';
import SendNotificationModal from './Notifications/SendNotificationModal';
import EnhancedDashboard from './Dashboard/EnhancedDashboard';
import PlannerWidgets from './Dashboard/PlannerWidgets';
import FinanceWidgets from './Dashboard/FinanceWidgets';
import CoordinatorWidgets from './Dashboard/CoordinatorWidgets';
import SuperAdminWidgets from './Dashboard/SuperAdminWidgets';
import RecentEventsTable from './Dashboard/RecentEventsTable';
import RecentOverduePayments from './Dashboard/RecentOverduePayments';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalClients: 0,
        upcomingEvents: 0,
        eventsThisMonth: 0,
        teamMembers: 0
    });
    const [loading, setLoading] = useState(true);
    const [isSendNotificationModalOpen, setIsSendNotificationModalOpen] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        if (userInfo.role !== 'PLANNER_OWNER') {
            fetchStats();
        }
    }, []);

    const fetchStats = async () => {
        try {
            const token = userInfo.token;

            // Fetch clients count (not for COORDINATOR)
            if (userInfo.role !== 'COORDINATOR') {
                const clientsRes = await fetch('https://samaaroh-1.onrender.com/api/clients?page=1&limit=1', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const clientsData = await clientsRes.json();
                if (clientsRes.ok) {
                    setStats(prev => ({ ...prev, totalClients: clientsData.pagination?.total || 0 }));
                }
            }

            // Fetch event stats
            const statsRes = await fetch('https://samaaroh-1.onrender.com/api/events/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const statsData = await statsRes.json();
            if (statsRes.ok) {
                setStats(prev => ({
                    ...prev,
                    upcomingEvents: statsData.data?.upcomingEvents || 0,
                    eventsThisMonth: statsData.data?.eventsThisMonth || 0
                }));
            }

            // Fetch team members count (PLANNER_OWNER only)
            if (userInfo.role === 'PLANNER_OWNER') {
                const teamRes = await fetch('https://samaaroh-1.onrender.com/api/team', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const teamData = await teamRes.json();
                if (teamRes.ok) {
                    setStats(prev => ({ ...prev, teamMembers: teamData.data?.length || 0 }));
                }
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const canAccessClients = ['PLANNER_OWNER', 'PLANNER', 'FINANCE'].includes(userInfo.role);
    const canCreateEvent = ['PLANNER_OWNER', 'PLANNER'].includes(userInfo.role);

    // Show Enhanced Dashboard for PLANNER_OWNER
    if (userInfo.role === 'PLANNER_OWNER') {
        return <EnhancedDashboard />;
    }

    return (
        <div className="p-8">
            <header className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
                <p className="text-slate-500">Welcome back, {userInfo.name || 'User'}</p>
            </header>

            {/* Role-Based Widgets */}
            <div className={`grid gap-6 mb-8 ${userInfo.role === 'SUPER_ADMIN' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                {userInfo.role === 'SUPER_ADMIN' && <SuperAdminWidgets stats={stats} loading={loading} />}
                {userInfo.role === 'PLANNER' && <PlannerWidgets stats={stats} loading={loading} />}
                {userInfo.role === 'FINANCE' && <FinanceWidgets stats={stats} loading={loading} />}
                {userInfo.role === 'COORDINATOR' && <CoordinatorWidgets stats={stats} loading={loading} />}
            </div>

            {/* Recent Events Table for PLANNER */}
            {userInfo.role === 'PLANNER' && (
                <div className="mb-8">
                    <RecentEventsTable />
                </div>
            )}

            {/* Recent Overdue Payments for FINANCE */}
            {userInfo.role === 'FINANCE' && (
                <div className="mb-8">
                    <RecentOverduePayments />
                </div>
            )}

            {/* Quick Actions */}
            {canCreateEvent && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {canAccessClients && (
                            <button onClick={() => navigate('/clients')} className="flex items-center justify-center space-x-2 px-6 py-4 border-2 border-primary-200 text-primary-700 rounded-lg hover:bg-primary-50 transition-colors font-medium">
                                <Add size="20" color="currentColor" />
                                <span>Add New Client</span>
                            </button>
                        )}
                        <button onClick={() => navigate('/events/create')} className="flex items-center justify-center space-x-2 px-6 py-4 border-2 border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition-colors font-medium">
                            <Add size="20" color="currentColor" />
                            <span>Create Event</span>
                        </button>
                        <button onClick={() => setIsSendNotificationModalOpen(true)} className="flex items-center justify-center space-x-2 px-6 py-4 border-2 border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors font-medium">
                            <Notification size="20" color="currentColor" />
                            <span>Send Notification</span>
                        </button>
                    </div>
                </div>
            )}

            <SendNotificationModal
                isOpen={isSendNotificationModalOpen}
                onClose={() => setIsSendNotificationModalOpen(false)}
            />
        </div>
    );
};

export default Dashboard;

