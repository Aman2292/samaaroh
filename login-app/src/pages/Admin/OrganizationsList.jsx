import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Add, SearchNormal1, Refresh2, Setting, Eye, Trash, Forbidden2, TickCircle, Calendar, Profile2User } from 'iconsax-react';
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
    const [showFeaturesModal, setShowFeaturesModal] = useState(false);
    const [features, setFeatures] = useState({});

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
                setOrganizations(data.data || []);
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

    const openFeaturesModal = (org) => {
        setSelectedOrg(org);
        const defaultFeatures = {
            clients: true,
            events: { access: true, guests: true, payments: true, tasks: true },
            payments: { access: true, client: true, vendor: true },
            team: { access: true, manage: true, export: true },
            tasks: true,
            venue: { access: true, profile: true, gallery: true, packages: true, availability: true, tasks: true }
        };

        const orgFeatures = org.subscribedFeatures || {};

        const normalize = (val, defaults) => {
            if (val === true || val === false) return { ...defaults, access: val };
            if (val && typeof val === 'object') return { ...defaults, ...val };
            return defaults;
        };

        const mergedFeatures = {
            ...defaultFeatures,
            clients: orgFeatures.clients ?? defaultFeatures.clients,
            tasks: orgFeatures.tasks ?? defaultFeatures.tasks,
            events: normalize(orgFeatures.events, defaultFeatures.events),
            payments: normalize(orgFeatures.payments, defaultFeatures.payments),
            team: normalize(orgFeatures.team, defaultFeatures.team),
            venue: normalize(orgFeatures.venue, defaultFeatures.venue)
        };

        setFeatures(mergedFeatures);
        setShowFeaturesModal(true);
    };

    const handleUpdateFeatures = async () => {
        try {
            setActionLoading(true);
            const response = await fetch(
                `http://localhost:5001/api/admin/organizations/${selectedOrg._id}/features`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userInfo.token}`
                    },
                    body: JSON.stringify({ features })
                }
            );

            const data = await response.json();
            if (response.ok) {
                toast.success('Features updated successfully');
                setShowFeaturesModal(false);
                fetchOrganizations();
            } else {
                toast.error(data.error || 'Failed to update features');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setActionLoading(false);
        }
    };

    const toggleFeature = (key, subKey = null) => {
        if (subKey) {
            setFeatures(prev => ({
                ...prev,
                [key]: {
                    ...prev[key],
                    [subKey]: !prev[key][subKey]
                }
            }));
        } else {
            setFeatures(prev => {
                const currentVal = prev[key];
                const isObject = typeof currentVal === 'object';

                if (isObject) {
                    return {
                        ...prev,
                        [key]: {
                            ...prev[key],
                            access: !prev[key].access
                        }
                    };
                }

                return {
                    ...prev,
                    [key]: !currentVal
                };
            });
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {organizations.map((org) => (
                                <div key={org._id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <h3 className="text-lg font-bold text-slate-800 truncate" title={org.name}>
                                                {org.name}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Joined {new Date(org.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                        {getStatusBadge(org.status)}
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center space-x-3 text-slate-600">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                                <span className="text-xs font-bold">
                                                    {org.ownerUserId?.name?.charAt(0) || 'U'}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-800 truncate">{org.ownerUserId?.name || 'Unknown'}</p>
                                                <p className="text-xs text-slate-500 truncate">{org.ownerUserId?.email}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div className="bg-slate-50 p-2.5 rounded-xl flex items-center space-x-3">
                                                <div className="bg-purple-100 p-1.5 rounded-lg text-purple-600">
                                                    <Calendar size="16" color="currentColor" />
                                                </div>
                                                <div>
                                                    <span className="text-xs text-slate-500 block">Events</span>
                                                    <span className="text-sm font-bold text-slate-800">{org.eventsCount || 0}</span>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 p-2.5 rounded-xl flex items-center space-x-3">
                                                <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                                                    <Profile2User size="16" color="currentColor" />
                                                </div>
                                                <div>
                                                    <span className="text-xs text-slate-500 block">Users</span>
                                                    <span className="text-sm font-bold text-slate-800">{org.usersCount || 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {org.recentEvents && org.recentEvents.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Recent Events</p>
                                                <div className="space-y-2">
                                                    {org.recentEvents.map((event, idx) => (
                                                        <div key={idx} className="flex items-center justify-between text-sm">
                                                            <div className="flex items-center space-x-2 min-w-0">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></div>
                                                                <span className="truncate text-slate-700 font-medium" title={event.eventName}>{event.eventName}</span>
                                                            </div>
                                                            <span className="text-xs text-slate-500 shrink-0">
                                                                {new Date(event.eventDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center space-x-2 text-sm text-slate-500 pt-1">
                                            <Building size="16" className="text-slate-400" />
                                            <span className="truncate">{org.city || 'No Location'}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div className="flex space-x-1">
                                            {org.status === 'active' ? (
                                                <button
                                                    onClick={() => {
                                                        setSelectedOrg(org);
                                                        setShowSuspendModal(true);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                    title="Suspend"
                                                >
                                                    <Forbidden2 size="18" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleUnsuspend(org)}
                                                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Activate"
                                                >
                                                    <TickCircle size="18" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setSelectedOrg(org);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash size="18" />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => navigate(`/admin/organizations/${org._id}`)}
                                            className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 hover:shadow-md transition-all active:scale-95"
                                        >
                                            <span>Manage</span>
                                            <Setting size="16" color="currentColor" />
                                        </button>
                                    </div>
                                </div>
                            ))}
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
        </div >
    );
};

export default OrganizationsList;
