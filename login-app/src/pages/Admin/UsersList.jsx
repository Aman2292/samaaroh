import React, { useState, useEffect } from 'react';
import { User, SearchNormal1, Refresh2 } from 'iconsax-react';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import { toast } from 'react-toastify';
import useDebounce from '../../hooks/useDebounce';

const UsersList = () => {
    const [users, setUsers] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [filters, setFilters] = useState({
        organizationId: '',
        role: '',
        status: ''
    });
    const [selectedUser, setSelectedUser] = useState(null);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const debouncedSearch = useDebounce(search, 300);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        fetchOrganizations();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [page, debouncedSearch, filters]);

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
            console.error('Failed to fetch organizations');
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20'
            });

            if (debouncedSearch) params.append('search', debouncedSearch);
            if (filters.organizationId) params.append('organizationId', filters.organizationId);
            if (filters.role) params.append('role', filters.role);
            if (filters.status) params.append('status', filters.status);

            const response = await fetch(`http://localhost:5001/api/admin/users?${params}`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setUsers(data.data);
                setPagination(data.pagination);
            } else {
                toast.error(data.error || 'Failed to fetch users');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async () => {
        try {
            setActionLoading(true);
            const response = await fetch(
                `http://localhost:5001/api/admin/users/${selectedUser._id}/deactivate`,
                {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                }
            );

            const data = await response.json();
            if (response.ok) {
                toast.success('User deactivated successfully');
                setShowDeactivateModal(false);
                fetchUsers();
            } else {
                toast.error(data.error || 'Failed to deactivate user');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setActionLoading(false);
        }
    };

    const handleActivate = async () => {
        try {
            setActionLoading(true);
            const response = await fetch(
                `http://localhost:5001/api/admin/users/${selectedUser._id}/activate`,
                {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                }
            );

            const data = await response.json();
            if (response.ok) {
                toast.success('User activated successfully');
                setShowDeactivateModal(false);
                fetchUsers();
            } else {
                toast.error(data.error || 'Failed to activate user');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setActionLoading(false);
        }
    };

    const handleResetPassword = async (user) => {
        try {
            const response = await fetch(
                `http://localhost:5001/api/admin/users/${user._id}/reset-password`,
                {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                }
            );

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
            } else {
                toast.error(data.error || 'Failed to reset password');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        }
    };

    const getRoleBadge = (role) => {
        const roleConfig = {
            SUPER_ADMIN: { bg: 'bg-purple-100', text: 'text-purple-700' },
            PLANNER_OWNER: { bg: 'bg-blue-100', text: 'text-blue-700' },
            PLANNER: { bg: 'bg-green-100', text: 'text-green-700' },
            FINANCE: { bg: 'bg-orange-100', text: 'text-orange-700' },
            COORDINATOR: { bg: 'bg-slate-100', text: 'text-slate-700' }
        };

        const config = roleConfig[role] || roleConfig.COORDINATOR;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {role?.replace('_', ' ')}
            </span>
        );
    };

    const getStatusBadge = (isActive) => {
        if (isActive) {
            return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>;
        }
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Inactive</span>;
    };

    const getRelativeTime = (date) => {
        if (!date) return 'Never';
        const now = new Date();
        const loginDate = new Date(date);
        const diffMs = now - loginDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return loginDate.toLocaleDateString('en-IN');
    };

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Users</h1>
                        <p className="text-slate-500 mt-1">Manage all users across organizations</p>
                    </div>
                    <button
                        onClick={fetchUsers}
                        className="flex items-center space-x-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <Refresh2 size="20" color="currentColor" />
                        <span>Refresh</span>
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <SearchNormal1 size="20" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                    <select
                        value={filters.organizationId}
                        onChange={(e) => setFilters({ ...filters, organizationId: e.target.value })}
                        className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="">All Organizations</option>
                        {organizations.map(org => (
                            <option key={org._id} value={org._id}>{org.name}</option>
                        ))}
                    </select>
                    <select
                        value={filters.role}
                        onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                        className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="">All Roles</option>
                        <option value="PLANNER_OWNER">Planner Owner</option>
                        <option value="PLANNER">Planner</option>
                        <option value="FINANCE">Finance</option>
                        <option value="COORDINATOR">Coordinator</option>
                    </select>
                </div>

                {loading ? (
                    <LoadingSkeleton type="table" count={10} />
                ) : users.length === 0 ? (
                    <EmptyState
                        icon={User}
                        title="No users found"
                        description={search || filters.organizationId || filters.role ? "Try adjusting your filters" : "No users registered yet"}
                    />
                ) : (
                    <>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Organization</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Last Login</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Created</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map((user) => (
                                        <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-800">{user.name}</div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{user.organizationId?.name || 'N/A'}</td>
                                            <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                                            <td className="px-6 py-4">{getStatusBadge(user.isActive)}</td>
                                            <td className="px-6 py-4 text-slate-600 text-sm">
                                                {getRelativeTime(user.lastLogin)}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 text-sm">
                                                {new Date(user.createdAt).toLocaleDateString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleResetPassword(user)}
                                                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                                                    >
                                                        Reset Password
                                                    </button>
                                                    {user.isActive && user.role !== 'SUPER_ADMIN' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setShowDeactivateModal(true);
                                                            }}
                                                            className="text-red-600 hover:text-red-700 font-medium text-sm"
                                                        >
                                                            Deactivate
                                                        </button>
                                                    )}
                                                    {!user.isActive && user.role !== 'SUPER_ADMIN' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setShowDeactivateModal(true);
                                                            }}
                                                            className="text-green-600 hover:text-green-700 font-medium text-sm"
                                                        >
                                                            Activate
                                                        </button>
                                                    )}
                                                </div>
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
                                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
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

                {/* Deactivate Modal */}
                {showDeactivateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold text-slate-800 mb-4">{selectedUser?.isActive ? 'Block User' : 'Unblock User'}</h3>
                            <p className="text-slate-600 mb-4">
                                Are you sure you want to {selectedUser?.isActive ? 'block' : 'unblock'} <strong>{selectedUser?.name}</strong>?
                                {selectedUser?.isActive ? ' They will be unable to login.' : ' They will sortly be able to login again.'}
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowDeactivateModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={selectedUser?.isActive ? handleDeactivate : handleActivate}
                                    className={`flex-1 px-4 py-2 text-white rounded-lg ${selectedUser?.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Processing...' : (selectedUser?.isActive ? 'Block' : 'Unblock')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UsersList;
