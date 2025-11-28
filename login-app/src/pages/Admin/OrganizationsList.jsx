import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Add, SearchNormal1, Refresh2 } from 'iconsax-react';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import { toast } from 'react-toastify';
import useDebounce from '../../hooks/useDebounce';

const OrganizationsList = () => {
    const navigate = useNavigate();
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [suspendReason, setSuspendReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const debouncedSearch = useDebounce(search, 300);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        fetchOrganizations();
    }, [page, debouncedSearch]);

    const fetchOrganizations = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20'
            });

            if (debouncedSearch) {
                params.append('search', debouncedSearch);
            }

            const response = await fetch(`http://localhost:5001/api/admin/organizations?${params}`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setOrganizations(data.data);
                setPagination(data.pagination);
            } else {
                toast.error(data.error || 'Failed to fetch organizations');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleSuspend = async () => {
        if (!suspendReason.trim()) {
            toast.error('Please provide a reason for suspension');
            return;
        }

        try {
            setActionLoading(true);
            const response = await fetch(
                `http://localhost:5001/api/admin/organizations/${selectedOrg._id}/suspend`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userInfo.token}`
                    },
                    body: JSON.stringify({ reason: suspendReason })
                }
            );

            const data = await response.json();
            if (response.ok) {
                toast.success('Organization suspended successfully');
                setShowSuspendModal(false);
                setSuspendReason('');
                fetchOrganizations();
            } else {
                toast.error(data.error || 'Failed to suspend organization');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnsuspend = async (org) => {
        try {
            const response = await fetch(
                `http://localhost:5001/api/admin/organizations/${org._id}/unsuspend`,
                {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                }
            );

            const data = await response.json();
            if (response.ok) {
                toast.success('Organization unsuspended successfully');
                fetchOrganizations();
            } else {
                toast.error(data.error || 'Failed to unsuspend organization');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        }
    };

    const handleDelete = async () => {
        try {
            setActionLoading(true);
            const response = await fetch(
                `http://localhost:5001/api/admin/organizations/${selectedOrg._id}`,
                {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                }
            );

            const data = await response.json();
            if (response.ok) {
                toast.success('Organization deleted successfully');
                setShowDeleteModal(false);
                fetchOrganizations();
            } else {
                toast.error(data.error || 'Failed to delete organization');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'suspended') {
            return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Suspended</span>;
        }
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>;
    };

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Organizations</h1>
                        <p className="text-slate-500 mt-1">Manage all organizations on the platform</p>
                    </div>
                    <button
                        onClick={fetchOrganizations}
                        className="flex items-center space-x-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <Refresh2 size="20" color="currentColor" />
                        <span>Refresh</span>
                    </button>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <SearchNormal1 size="20" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by organization name or city..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                {loading ? (
                    <LoadingSkeleton type="table" count={10} />
                ) : organizations.length === 0 ? (
                    <EmptyState
                        icon={Building}
                        title="No organizations found"
                        description={search ? "Try adjusting your search" : "No organizations registered yet"}
                    />
                ) : (
                    <>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Organization</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Owner</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">City</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Events</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Users</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {organizations.map((org) => (
                                        <tr key={org._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-800">{org.name}</div>
                                                <div className="text-xs text-slate-500">
                                                    {new Date(org.createdAt).toLocaleDateString('en-IN')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-slate-800">{org.ownerUserId?.name}</div>
                                                <div className="text-xs text-slate-500">{org.ownerUserId?.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{org.city || 'N/A'}</td>
                                            <td className="px-6 py-4 text-slate-600">{org.eventsCount || 0}</td>
                                            <td className="px-6 py-4 text-slate-600">{org.usersCount || 0}</td>
                                            <td className="px-6 py-4">{getStatusBadge(org.status)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => navigate(`/admin/organizations/${org._id}`)}
                                                        className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                                                    >
                                                        View
                                                    </button>
                                                    {org.status === 'active' ? (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedOrg(org);
                                                                setShowSuspendModal(true);
                                                            }}
                                                            className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                                                        >
                                                            Suspend
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleUnsuspend(org)}
                                                            className="text-green-600 hover:text-green-700 font-medium text-sm"
                                                        >
                                                            Unsuspend
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedOrg(org);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className="text-red-600 hover:text-red-700 font-medium text-sm"
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

                        {/* Pagination */}
                        {pagination && pagination.pages > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <p className="text-sm text-slate-600">
                                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} organizations
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

                {/* Suspend Modal */}
                {showSuspendModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold text-slate-800 mb-4">Suspend Organization</h3>
                            <p className="text-slate-600 mb-4">
                                Are you sure you want to suspend <strong>{selectedOrg?.name}</strong>? All users in this organization will be unable to login.
                            </p>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Reason for suspension *
                                </label>
                                <textarea
                                    value={suspendReason}
                                    onChange={(e) => setSuspendReason(e.target.value)}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Enter reason..."
                                />
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowSuspendModal(false);
                                        setSuspendReason('');
                                    }}
                                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSuspend}
                                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Suspending...' : 'Suspend'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold text-slate-800 mb-4">Delete Organization</h3>
                            <p className="text-slate-600 mb-4">
                                Are you sure you want to delete <strong>{selectedOrg?.name}</strong>? This action will soft delete the organization and all its users.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrganizationsList;
