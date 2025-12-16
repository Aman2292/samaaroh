import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Eye, Building, SearchNormal, Refresh, ArrowLeft } from 'iconsax-react';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';
import { toast } from 'react-toastify';

const AdminEvents = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [events, setEvents] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    // Get organizationId from URL params
    const selectedOrgId = searchParams.get('organizationId') || '';

    const [filters, setFilters] = useState({
        status: '',
        eventType: '',
        dateFrom: '',
        dateTo: ''
    });

    const [stats, setStats] = useState({
        total: 0,
        byStatus: {}
    });

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        fetchOrganizations();
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [page, selectedOrgId, filters]);

    const fetchOrganizations = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/admin/organizations?limit=100', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setOrganizations(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch organizations:', error);
        }
    };

    const fetchEvents = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(selectedOrgId && { organizationId: selectedOrgId }),
                ...(filters.status && { status: filters.status }),
                ...(filters.eventType && { eventType: filters.eventType }),
                ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
                ...(filters.dateTo && { dateTo: filters.dateTo })
            });

            const response = await fetch(`http://localhost:5001/api/events?${params}`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();

            if (response.ok) {
                setEvents(data.data);
                setPagination(data.pagination);

                // Calculate stats
                const total = data.pagination.total;
                const byStatus = data.data.reduce((acc, event) => {
                    acc[event.status] = (acc[event.status] || 0) + 1;
                    return acc;
                }, {});
                setStats({ total, byStatus });
            } else {
                setError(data.error || 'Failed to fetch events');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleOrganizationChange = (orgId) => {
        if (orgId) {
            searchParams.set('organizationId', orgId);
        } else {
            searchParams.delete('organizationId');
        }
        setSearchParams(searchParams);
        setPage(1);
    };

    const getStatusColor = (status) => {
        const colors = {
            lead: 'bg-blue-100 text-blue-700',
            booked: 'bg-green-100 text-green-700',
            in_progress: 'bg-yellow-100 text-yellow-700',
            completed: 'bg-gray-100 text-gray-700',
            cancelled: 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const getSelectedOrgName = () => {
        const org = organizations.find(o => o._id === selectedOrgId);
        return org ? org.name : 'All Organizations';
    };

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">Events Management</h1>
                            <p className="text-slate-500 mt-1">View and manage events across all organizations</p>
                        </div>
                        <button
                            onClick={() => navigate('/admin/organizations')}
                            className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span>Back to Organizations</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4">
                        <div className="text-sm text-slate-500 mb-1">Total Events</div>
                        <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-100 p-4">
                        <div className="text-sm text-blue-600 mb-1">Lead</div>
                        <div className="text-2xl font-bold text-blue-700">{stats.byStatus.lead || 0}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg shadow-sm border border-green-100 p-4">
                        <div className="text-sm text-green-600 mb-1">Booked</div>
                        <div className="text-2xl font-bold text-green-700">{stats.byStatus.booked || 0}</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-100 p-4">
                        <div className="text-sm text-yellow-600 mb-1">In Progress</div>
                        <div className="text-2xl font-bold text-yellow-700">{stats.byStatus.in_progress || 0}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-100 p-4">
                        <div className="text-sm text-gray-600 mb-1">Completed</div>
                        <div className="text-2xl font-bold text-gray-700">{stats.byStatus.completed || 0}</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Organization Selector */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Organization</label>
                            <select
                                value={selectedOrgId}
                                onChange={(e) => handleOrganizationChange(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">All Organizations</option>
                                {organizations.map(org => (
                                    <option key={org._id} value={org._id}>{org.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">All Statuses</option>
                                <option value="lead">Lead</option>
                                <option value="booked">Booked</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        {/* Event Type Filter */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Event Type</label>
                            <select
                                value={filters.eventType}
                                onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">All Types</option>
                                <option value="wedding">Wedding</option>
                                <option value="corporate">Corporate</option>
                                <option value="birthday">Birthday</option>
                                <option value="anniversary">Anniversary</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Date From */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">From Date</label>
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        {/* Date To */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">To Date</label>
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-slate-200">
                        <button
                            onClick={() => {
                                setFilters({ status: '', eventType: '', dateFrom: '', dateTo: '' });
                                handleOrganizationChange('');
                            }}
                            className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                        >
                            <Refresh size={18} />
                            <span>Clear All Filters</span>
                        </button>
                        <div className="text-sm text-slate-500">
                            Viewing: <span className="font-medium text-slate-700">{getSelectedOrgName()}</span>
                        </div>
                    </div>
                </div>

                {/* Events Table */}
                {loading ? (
                    <LoadingSkeleton type="table" count={5} />
                ) : error ? (
                    <ErrorMessage message={error} onRetry={fetchEvents} />
                ) : events.length === 0 ? (
                    <EmptyState
                        icon={Calendar}
                        title="No events found"
                        description={selectedOrgId
                            ? "This organization has no events matching the selected filters"
                            : "No events found across all organizations with the selected filters"}
                    />
                ) : (
                    <>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Event Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Organization</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Client</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {events.map((event) => (
                                        <tr key={event._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-800">{event.eventName}</div>
                                                <div className="text-sm text-slate-500">{event.venueId?.name || 'No venue'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => navigate(`/admin/organizations/${event.organizationId}`)}
                                                    className="flex items-center space-x-1 text-primary-600 hover:text-primary-800 transition-colors"
                                                >
                                                    <Building size={16} />
                                                    <span className="text-sm">
                                                        {organizations.find(o => o._id === event.organizationId)?.name || 'Unknown'}
                                                    </span>
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {event.clientId?.name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {new Date(event.eventDate).toLocaleDateString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="capitalize text-slate-600">{event.eventType}</span>
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
                                                    <span>View</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.pages > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <p className="text-sm text-slate-600">
                                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} events
                                </p>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setPage(page - 1)}
                                        disabled={page === 1}
                                        className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage(page + 1)}
                                        disabled={page === pagination.pages}
                                        className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminEvents;
