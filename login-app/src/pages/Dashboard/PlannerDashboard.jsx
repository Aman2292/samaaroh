import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, TrendUp, CalendarTick, Eye } from 'iconsax-react';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorMessage from '../../components/common/ErrorMessage';

const PlannerDashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        myEvents: 0,
        upcomingEvents: 0,
        eventsThisMonth: 0,
        riskyEvents: 0,
        cashStuck: 0
    });
    const [recentEvents, setRecentEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch stats and recent events in parallel
            const [statsRes, eventsRes] = await Promise.all([
                fetch('https://samaaroh-1.onrender.com/api/events/stats', {
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                }),
                fetch('https://samaaroh-1.onrender.com/api/events?page=1&limit=5', {
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                })
            ]);

            const statsData = await statsRes.json();
            const eventsData = await eventsRes.json();

            if (statsRes.ok && eventsRes.ok) {
                // Calculate stats from events data
                const allEvents = eventsData.data || [];
                const today = new Date();
                const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

                setStats({
                    myEvents: eventsData.pagination?.total || 0,
                    upcomingEvents: statsData.data?.upcomingEvents || 0,
                    eventsThisMonth: statsData.data?.eventsThisMonth || 0,
                    riskyEvents: statsData.data?.riskyEvents || 0,
                    cashStuck: statsData.data?.cashStuck || 0
                });
                setRecentEvents(allEvents.slice(0, 5));
            } else {
                setError(t('dashboard.fetchError') || 'Failed to fetch dashboard data');
            }
        } catch (err) {
            setError(t('dashboard.serverError') || 'Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            lead: 'bg-blue-100 text-blue-700',
            booked: 'bg-green-100 text-green-700',
            in_progress: 'bg-yellow-100 text-yellow-700',
            completed: 'bg-gray-100 text-gray-700',
            cancelled: 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700'
    };

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">{t('dashboard.welcome', { name: userInfo.name })}</h1>
                    <p className="text-slate-500 mt-1">{t('dashboard.overview')}</p>
                </div>

                {loading ? (
                    <LoadingSkeleton type="cards" count={3} />
                ) : error ? (
                    <ErrorMessage message={error} onRetry={fetchDashboardData} />
                ) : (
                    <>
                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* My Events Card */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">{t('dashboard.myEvents')}</p>
                                        <p className="text-3xl font-bold text-slate-800 mt-2">{stats.myEvents}</p>
                                        <p className="text-xs text-slate-500 mt-1">{t('dashboard.myEventsDesc')}</p>
                                    </div>
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <Calendar size="32" color="#3b82f6" variant="Bold" />
                                    </div>
                                </div>
                            </div>

                            {/* Upcoming Events Card */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">{t('dashboard.upcomingEvents')}</p>
                                        <p className="text-3xl font-bold text-slate-800 mt-2">{stats.upcomingEvents}</p>
                                        <p className="text-xs text-slate-500 mt-1">{t('dashboard.next7Days')}</p>
                                    </div>
                                    <div className="p-3 bg-orange-50 rounded-lg">
                                        <TrendUp size="32" color="#f97316" variant="Bold" />
                                    </div>
                                </div>
                            </div>

                            {/* Events This Month Card */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">{t('dashboard.eventsThisMonth')}</p>
                                        <p className="text-3xl font-bold text-slate-800 mt-2">{stats.eventsThisMonth}</p>
                                        <p className="text-xs text-slate-500 mt-1">{t('dashboard.currentMonth')}</p>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-lg">
                                        <CalendarTick size="32" color="#10b981" variant="Bold" />
                                    </div>
                                </div>
                            </div>

                            {/* Feature 6: Smart Analytics Cards */}

                            {/* Risky Events Card - Only show if > 0 */}
                            {stats.riskyEvents > 0 && (
                                <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-red-600">{t('dashboard.riskyEvents')}</p>
                                            <p className="text-3xl font-bold text-red-700 mt-2">{stats.riskyEvents}</p>
                                            <p className="text-xs text-red-500 mt-1">{t('dashboard.riskyEventsDesc')}</p>
                                        </div>
                                        <div className="p-3 bg-red-50 rounded-lg animate-pulse">
                                            <Calendar size="32" color="#ef4444" variant="Bold" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Cash Stuck Card - Only show if > 0 */}
                            {stats.cashStuck > 0 && (
                                <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-orange-600">{t('dashboard.cashStuck')}</p>
                                            <p className="text-3xl font-bold text-orange-700 mt-2">
                                                ₹{(stats.cashStuck / 1000).toFixed(1)}k
                                            </p>
                                            <p className="text-xs text-orange-500 mt-1">{t('dashboard.cashStuckDesc')}</p>
                                        </div>
                                        <div className="p-3 bg-orange-50 rounded-lg">
                                            <TrendUp size="32" color="#f97316" variant="Bold" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Recent Events Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-100">
                                <h2 className="text-xl font-bold text-slate-800">{t('dashboard.recentEvents')}</h2>
                                <p className="text-sm text-slate-500 mt-1">{t('dashboard.last5Events')}</p>
                            </div>

                            {recentEvents.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Calendar size="64" color="#cbd5e1" className="mx-auto mb-4" />
                                    <p className="text-slate-500">{t('dashboard.noEvents')}</p>
                                    <p className="text-sm text-slate-400 mt-1">{t('dashboard.noEventsDesc')}</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('events.eventName')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('clients.title')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('events.eventDate')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('common.status')}</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">{t('common.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {recentEvents.map((event) => (
                                            <tr key={event._id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-800">{event.eventName}</div>
                                                    <div className="text-sm text-slate-500">{event.venue || t('dashboard.noVenue')}</div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {event.clientId?.name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {new Date(event.eventDate).toLocaleDateString('en-IN')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                                                        {event.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => navigate(`/events/${event._id}`)}
                                                        className="text-primary-600 hover:text-primary-800 transition-colors flex items-center justify-end space-x-1"
                                                    >
                                                        <Eye size="16" color="currentColor" />
                                                        <span>{t('dashboard.view')}</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PlannerDashboard;
