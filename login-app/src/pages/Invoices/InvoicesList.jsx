import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Add, DocumentText1, SearchNormal1, Filter, DirectboxReceive, Edit2 } from 'iconsax-react';
import InvoiceDetailSidebar from '../../components/Invoices/InvoiceDetailSidebar';

const InvoicesList = () => {
    const [invoices, setInvoices] = useState([]);
    const [filteredInvoices, setFilteredInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [stats, setStats] = useState(null);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigate = useNavigate();
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    useEffect(() => {
        fetchInvoices();
        fetchStats();
    }, []);

    useEffect(() => {
        filterInvoices();
    }, [searchTerm, statusFilter, dateFrom, dateTo, invoices]);

    const fetchInvoices = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/invoices', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setInvoices(data.data);
                setFilteredInvoices(data.data);
            } else {
                toast.error(data.error || 'Failed to fetch invoices');
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
            toast.error('Failed to fetch invoices');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/invoices/stats', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const filterInvoices = () => {
        let filtered = [...invoices];

        if (searchTerm) {
            filtered = filtered.filter(invoice =>
                invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                invoice.clientId?.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter) {
            filtered = filtered.filter(invoice => invoice.status === statusFilter);
        }

        // Date range filter
        if (dateFrom) {
            filtered = filtered.filter(invoice =>
                new Date(invoice.invoiceDate) >= new Date(dateFrom)
            );
        }

        if (dateTo) {
            filtered = filtered.filter(invoice =>
                new Date(invoice.invoiceDate) <= new Date(dateTo)
            );
        }

        setFilteredInvoices(filtered);
    };

    const getStatusColor = (status) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-700',
            sent: 'bg-blue-100 text-blue-700',
            paid: 'bg-green-100 text-green-700',
            partial: 'bg-yellow-100 text-yellow-700',
            overdue: 'bg-red-100 text-red-700',
            cancelled: 'bg-gray-100 text-gray-500'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const handleDownloadPDF = async (invoiceId) => {
        try {
            const response = await fetch(`http://localhost:5001/api/invoices/${invoiceId}/generate-pdf`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();
            if (response.ok) {
                // Open PDF in new tab
                window.open(`http://localhost:5001${data.data.pdfUrl}`, '_blank');
                toast.success('PDF generated successfully');
            } else {
                toast.error(data.error || 'Failed to generate PDF');
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
                    <p className="text-gray-600 mt-1">Manage your client invoices</p>
                </div>
                <button
                    onClick={() => navigate('/invoices/create')}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Add size={20} />
                    <span>Create Invoice</span>
                </button>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    ₹{stats.revenue?.total?.toLocaleString('en-IN') || 0}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <DocumentText1 size={24} className="text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Paid Amount</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">
                                    ₹{stats.revenue?.paid?.toLocaleString('en-IN') || 0}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <DirectboxReceive size={24} className="text-green-600" variant="Bold" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending Amount</p>
                                <p className="text-2xl font-bold text-orange-600 mt-1">
                                    ₹{stats.revenue?.pending?.toLocaleString('en-IN') || 0}
                                </p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <DocumentText1 size={24} className="text-orange-600" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <SearchNormal1 size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by invoice number or client name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center space-x-2">
                        <Filter size={20} className="text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="">All Status</option>
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="paid">Paid</option>
                            <option value="partial">Partial</option>
                            <option value="overdue">Overdue</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Date Range Filter */}
                    <div className="flex items-center space-x-2">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            placeholder="From Date"
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            placeholder="To Date"
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    {/* Clear Filters */}
                    {(searchTerm || statusFilter || dateFrom || dateTo) && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('');
                                setDateFrom('');
                                setDateTo('');
                            }}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Invoice #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Client
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Due Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Paid
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Balance
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                                        <DocumentText1 size={48} className="mx-auto mb-4 text-gray-300" />
                                        <p className="text-lg font-medium">No invoices found</p>
                                        <p className="text-sm text-gray-400 mt-1">Create your first invoice to get started</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((invoice) => (
                                    <tr key={invoice._id} className="hover:bg-gray-50 cursor-pointer">
                                        <td
                                            className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600"
                                            onClick={() => navigate(`/invoices/${invoice._id}`)}
                                        >
                                            {invoice.invoiceNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {invoice.clientId?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(invoice.dueDate).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            ₹{invoice.total.toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                            ₹{invoice.paidAmount.toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <span className={invoice.balanceAmount > 0 ? 'text-orange-600' : 'text-green-600'}>
                                                ₹{invoice.balanceAmount.toLocaleString('en-IN')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                {invoice.status === 'draft' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/invoices/edit/${invoice._id}`);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                                                        title="Edit Invoice"
                                                    >
                                                        <Edit2 size={16} />
                                                        <span>Edit</span>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedInvoiceId(invoice._id);
                                                        setSidebarOpen(true);
                                                    }}
                                                    className="text-primary-600 hover:text-primary-900"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownloadPDF(invoice._id);
                                                    }}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    PDF
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary */}
            <div className="mt-4 text-sm text-gray-600">
                Showing {filteredInvoices.length} of {invoices.length} invoices
            </div>

            {/* Invoice Detail Sidebar */}
            <InvoiceDetailSidebar
                invoiceId={selectedInvoiceId}
                isOpen={sidebarOpen}
                onClose={() => {
                    setSidebarOpen(false);
                    setSelectedInvoiceId(null);
                }}
                onUpdate={() => {
                    fetchInvoices();
                    fetchStats();
                }}
            />
        </div>
    );
};

export default InvoicesList;
