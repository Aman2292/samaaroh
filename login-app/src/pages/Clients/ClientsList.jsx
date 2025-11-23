import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Add, SearchNormal1, User, Call } from 'iconsax-react';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';
import CreateClientModal from '../../components/Clients/CreateClientModal';
import useDebounce from '../../hooks/useDebounce';
import { toast } from 'react-toastify';

const ClientsList = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const debouncedSearch = useDebounce(search, 300);

    const fetchClients = async () => {
        try {
            setLoading(true);
            setError(null);

            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const queryParams = new URLSearchParams({
                page,
                limit: 10,
                ...(debouncedSearch && { search: debouncedSearch })
            });

            const response = await fetch(`http://localhost:5001/api/clients?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                setClients(data.data);
                setPagination(data.pagination);
            } else {
                setError(data.error || 'Failed to fetch clients');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, [page, debouncedSearch]);

    const handleDelete = async (clientId) => {
        if (!window.confirm('Are you sure you want to delete this client?')) return;

        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const response = await fetch(`http://localhost:5001/api/clients/${clientId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Client deleted successfully');
                fetchClients();
            } else {
                toast.error(data.error || 'Failed to delete client');
            }
        } catch (err) {
            toast.error('Failed to connect to server');
        }
    };

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Clients</h1>
                        <p className="text-slate-500 mt-1">Manage your client database</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center space-x-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                        <Add size="20" color="currentColor" />
                        <span>Add Client</span>
                    </button>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <SearchNormal1 size="20" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" color="currentColor" />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <LoadingSkeleton type="table" count={5} />
                ) : error ? (
                    <ErrorMessage message={error} onRetry={fetchClients} />
                ) : clients.length === 0 ? (
                    <EmptyState
                        icon={User}
                        title="No clients found"
                        description={debouncedSearch ? "No clients match your search" : "Get started by adding your first client"}
                        actionLabel={!debouncedSearch ? "+ Add First Client" : undefined}
                        onAction={!debouncedSearch ? () => setShowCreateModal(true) : undefined}
                    />
                ) : (
                    <>
                        {/* Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Phone</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">City</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Tags</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {clients.map((client) => (
                                        <tr key={client._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-slate-800">{client.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2 text-slate-600">
                                                    <Call size="16" color="currentColor" />
                                                    <span>{client.phone}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                {client.email || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                {client.city || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {client.tags && client.tags.length > 0 ? (
                                                        client.tags.map((tag, idx) => (
                                                            <span key={idx} className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-full">
                                                                {tag}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-slate-400 text-sm">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleDelete(client._id)}
                                                    className="text-red-600 hover:text-red-800 transition-colors"
                                                >
                                                    Delete
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
                                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} clients
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

            {/* Create Client Modal */}
            {showCreateModal && (
                <CreateClientModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        fetchClients();
                    }}
                />
            )}
        </div>
    );
};

export default ClientsList;
