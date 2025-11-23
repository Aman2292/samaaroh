import React, { useState, useEffect } from 'react';
import { Building, User, TrendUp, Activity } from 'iconsax-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SuperAdminWidgets = ({ stats, loading }) => {
    const [systemStats, setSystemStats] = useState({
        totalOrganizations: 0,
        totalUsers: 0,
        activeUsers: 0,
        totalEvents: 0,
        totalClients: 0,
        organizationGrowth: [],
        userDistribution: [],
        weeklyActivity: { events: [], clients: [] }
    });
    const [dataLoading, setDataLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSystemStats();
    }, []);

    const fetchSystemStats = async () => {
        try {
            setDataLoading(true);
            setError(null);

            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            console.log('🔍 Fetching system stats for user:', userInfo?.role);

            const response = await fetch('http://localhost:5001/api/admin/stats', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();
            console.log('📊 API Response:', data);

            if (response.ok) {
                setSystemStats(data.data);
                console.log('✅ System stats loaded:', data.data);
            } else {
                console.error('❌ API Error:', data.error);
                setError(data.error || 'Failed to fetch stats');
            }
        } catch (error) {
            console.error('❌ Fetch Error:', error);
            setError('Failed to connect to server');
        } finally {
            setDataLoading(false);
        }
    };

    // Format organization growth data for chart
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const organizationGrowthData = systemStats.organizationGrowth.map(item => ({
        month: monthNames[item._id.month - 1],
        orgs: item.count
    }));

    // Format user distribution for pie chart
    const roleColors = {
        'SUPER_ADMIN': '#8b5cf6',
        'PLANNER_OWNER': '#3b82f6',
        'PLANNER': '#10b981',
        'FINANCE': '#f59e0b',
        'COORDINATOR': '#ef4444'
    };

    const userDistributionData = systemStats.userDistribution.map(item => ({
        name: item._id.replace('_', ' '),
        value: item.count,
        color: roleColors[item._id] || '#64748b'
    }));

    // Format weekly activity data
    const last7Days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = dayNames[date.getDay()];

        const eventsCount = systemStats.weeklyActivity.events.find(e => e._id === dateStr)?.count || 0;
        const clientsCount = systemStats.weeklyActivity.clients.find(c => c._id === dateStr)?.count || 0;

        last7Days.push({
            day: dayName,
            events: eventsCount,
            clients: clientsCount
        });
    }

    // Calculate growth rate
    const growthRate = organizationGrowthData.length >= 2
        ? Math.round(((organizationGrowthData[organizationGrowthData.length - 1]?.orgs - organizationGrowthData[organizationGrowthData.length - 2]?.orgs) / organizationGrowthData[organizationGrowthData.length - 2]?.orgs) * 100)
        : 0;

    if (dataLoading) {
        return (
            <div className="col-span-full flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading system statistics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="col-span-full">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-600 font-semibold mb-2">⚠️ Error Loading Stats</p>
                    <p className="text-red-500 text-sm">{error}</p>
                    <button
                        onClick={fetchSystemStats}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Debug Info */}
            <div className="col-span-full bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                    <strong>📊 Real Data Loaded:</strong> Organizations: {systemStats.totalOrganizations},
                    Users: {systemStats.totalUsers}, Events: {systemStats.totalEvents},
                    Clients: {systemStats.totalClients}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="col-span-full grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-blue-100">Total Organizations</h3>
                        <Building size="24" color="currentColor" variant="Bold" />
                    </div>
                    <div className="text-3xl font-bold">{systemStats.totalOrganizations}</div>
                    <p className="text-xs text-blue-100 mt-1">Registered organizations</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-green-100">Total Users</h3>
                        <User size="24" color="currentColor" variant="Bold" />
                    </div>
                    <div className="text-3xl font-bold">{systemStats.totalUsers}</div>
                    <p className="text-xs text-green-100 mt-1">{systemStats.activeUsers} active users</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-orange-100">Growth Rate</h3>
                        <TrendUp size="24" color="currentColor" variant="Bold" />
                    </div>
                    <div className="text-3xl font-bold">{growthRate > 0 ? '+' : ''}{growthRate || 0}%</div>
                    <p className="text-xs text-orange-100 mt-1">vs last month</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-purple-100">Total Events</h3>
                        <Activity size="24" color="currentColor" variant="Bold" />
                    </div>
                    <div className="text-3xl font-bold">{systemStats.totalEvents}</div>
                    <p className="text-xs text-purple-100 mt-1">{systemStats.totalClients} clients</p>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="col-span-full grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Organization Growth Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Organization Growth (Last 6 Months)</h3>
                    {organizationGrowthData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={organizationGrowthData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="orgs"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    name="Organizations"
                                    dot={{ fill: '#3b82f6', r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[250px] flex items-center justify-center text-slate-400">
                            <div className="text-center">
                                <p>No growth data available</p>
                                <p className="text-xs mt-2">Organizations created in the last 6 months will appear here</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Distribution Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">User Distribution by Role</h3>
                    {userDistributionData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={userDistributionData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {userDistributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[250px] flex items-center justify-center text-slate-400">
                            <div className="text-center">
                                <p>No user data available</p>
                                <p className="text-xs mt-2">User role distribution will appear here</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Activity Chart */}
            <div className="col-span-full">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Weekly Activity Overview (Last 7 Days)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={last7Days}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="day" stroke="#64748b" />
                            <YAxis stroke="#64748b" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                            />
                            <Legend />
                            <Bar dataKey="events" fill="#3b82f6" name="Events Created" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="clients" fill="#10b981" name="Clients Added" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </>
    );
};

export default SuperAdminWidgets;
