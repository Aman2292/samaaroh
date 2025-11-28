import React, { useState, useEffect } from 'react';
import { DocumentDownload, Refresh2, DocumentText, AddCircle, Edit, Trash, Login, Logout, DocumentUpload } from 'iconsax-react';
import { toast } from 'react-toastify';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import Select from '../../components/common/Select';
import DatePicker from '../../components/common/DatePicker';

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [filters, setFilters] = useState({
        userId: '',
        action: '',
        resourceType: '',
        startDate: '',
        endDate: ''
    });
    const [teamMembers, setTeamMembers] = useState([]);
    const [exporting, setExporting] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    const actionTypes = [
        {
            value: 'create',
            label: 'Create',
            icon: AddCircle,
            bgColor: '#D1FAE5',
            textColor: '#065F46'
        },
        {
            value: 'update',
            label: 'Update',
            icon: Edit,
            bgColor: '#DBEAFE',
            textColor: '#1E40AF'
        },
        {
            value: 'delete',
            label: 'Delete',
            icon: Trash,
            bgColor: '#FEE2E2',
            textColor: '#991B1B'
        },
        {
            value: 'login',
            label: 'Login',
            icon: Login,
            bgColor: '#E0E7FF',
            textColor: '#3730A3'
        },
        {
            value: 'logout',
            label: 'Logout',
            icon: Logout,
            bgColor: '#F3F4F6',
            textColor: '#374151'
        },
        {
            value: 'export',
            label: 'Export',
            icon: DocumentUpload,
            bgColor: '#FEF3C7',
            textColor: '#92400E'
        }
    ];

    const resourceTypes = [
        { value: 'event', label: 'Event' },
        { value: 'client', label: 'Client' },
        { value: 'team', label: 'Team Member' },
        { value: 'payment', label: 'Payment' },
        { value: 'vendor', label: 'Vendor' },
        { value: 'task', label: 'Task' }
    ];

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [page, filters]);

    const fetchTeamMembers = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/team', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setTeamMembers(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch team members');
        }
    };

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page,
                limit: 20,
                ...filters
            });

            const response = await fetch(`http://localhost:5001/api/activity-logs?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await response.json();

            if (response.ok) {
                setLogs(data.data);
                setPagination(data.pagination);
            } else {
                setError(data.error || 'Failed to fetch logs');
            }
        } catch (error) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            const queryParams = new URLSearchParams({
                page: 1,
                limit: 1000, // Export all (or a large limit)
                userId: filters.userId,
                action: filters.action,
                resourceType: filters.resourceType,
                startDate: filters.startDate,
                endDate: filters.endDate
            });

            const response = await fetch(`http://localhost:5001/api/activity-logs?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();

            if (response.ok) {
                const csvContent = [
                    ['Timestamp', 'User', 'Role', 'Action', 'Resource Type', 'Resource Name', 'Description'],
                    ...data.data.map(log => [
                        new Date(log.createdAt).toLocaleString(),
                        log.userId?.name || 'Unknown',
                        log.userId?.role || 'N/A',
                        log.action,
                        log.targetType,
                        log.targetName || 'N/A',
                        log.details || ''
                    ])
                ].map(e => e.join(",")).join("\n");

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", `activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                toast.error('Failed to export logs');
            }
        } catch (error) {
            toast.error('Export failed');
        } finally {
            setExporting(false);
        }
    };

    const getActionBadge = (action) => {
        if (!action) {
            return (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    N/A
                </span>
            );
        }

        const colors = {
            create: 'bg-green-100 text-green-700',
            update: 'bg-blue-100 text-blue-700',
            delete: 'bg-red-100 text-red-700',
            login: 'bg-purple-100 text-purple-700',
            logout: 'bg-gray-100 text-gray-700',
            export: 'bg-yellow-100 text-yellow-700'
        };
        const color = colors[action] || 'bg-gray-100 text-gray-700';
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                {action.charAt(0).toUpperCase() + action.slice(1)}
            </span>
        );
    };

    const formatTimestamp = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Activity Logs</h1>
                        <p className="text-slate-500 mt-1">Track all actions within your organization</p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={handleExport}
                            disabled={exporting || logs.length === 0}
                            className="flex items-center space-x-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <DocumentDownload size="20" color="currentColor" />
                            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
                        </button>
                        <button
                            onClick={fetchLogs}
                            className="flex items-center space-x-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <Refresh2 size="20" color="currentColor" />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {/* User Filter */}
                        <div>
                            <Select
                                label="User"
                                value={filters.userId}
                                onChange={(e) => {
                                    setFilters({ ...filters, userId: e.target.value });
                                    setPage(1);
                                }}
                                options={[
                                    { value: '', label: 'All Users' },
                                    ...teamMembers.map(member => ({ value: member._id, label: member.name }))
                                ]}
                            />
                        </div>

                        {/* Action Filter */}
                        <div>
                            <Select
                                label="Action"
                                value={filters.action}
                                onChange={(e) => {
                                    setFilters({ ...filters, action: e.target.value });
                                    setPage(1);
                                }}
                                options={[
                                    { value: '', label: 'All Actions' },
                                    ...actionTypes
                                ]}
                            />
                        </div>

                        {/* Resource Type Filter */}
                        <div>
                            <Select
                                label="Resource Type"
                                value={filters.resourceType}
                                onChange={(e) => {
                                    setFilters({ ...filters, resourceType: e.target.value });
                                    setPage(1);
                                }}
                                options={[
                                    { value: '', label: 'All Types' },
                                    ...resourceTypes
                                ]}
                            />
                        </div>

                        {/* Start Date */}
                        <div>
                            <DatePicker
                                label="Start Date"
                                value={filters.startDate}
                                onChange={(date) => {
                                    const dateStr = date ? date.toISOString().split('T')[0] : '';
                                    setFilters({ ...filters, startDate: dateStr });
                                    setPage(1);
                                }}
                                placeholder="Select date"
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <DatePicker
                                label="End Date"
                                value={filters.endDate}
                                onChange={(date) => {
                                    const dateStr = date ? date.toISOString().split('T')[0] : '';
                                    setFilters({ ...filters, endDate: dateStr });
                                    setPage(1);
                                }}
                                placeholder="Select date"
                            />
                        </div>
                    </div>
                </div>

                {/* Activity Logs Table */}
                {loading ? (
                    <LoadingSkeleton type="table" count={10} />
                ) : logs.length === 0 ? (
                    <EmptyState
                        icon={DocumentText}
                        title="No activity logs found"
                        description="No activities match your current filters"
                    />
                ) : (
                    <>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Timestamp</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Resource</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {logs.map((log) => (
                                        <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                                                {formatTimestamp(log.createdAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-slate-800">{log.userId?.name || 'Unknown'}</div>
                                                <div className="text-xs text-slate-500">{log.userId?.role?.replace('_', ' ')}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getActionBadge(log.action)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 capitalize">
                                                {log.targetType}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {log.targetName || 'N/A'}
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
                                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
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

export default ActivityLogs;
