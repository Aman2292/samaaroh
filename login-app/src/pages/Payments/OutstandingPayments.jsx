import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoneyRecive, MoneySend, Calendar, Eye, Refresh2 } from 'iconsax-react';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import MarkPaidModal from '../../components/Payments/MarkPaidModal';
import { toast } from 'react-toastify';

const OutstandingPayments = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [paymentsData, setPaymentsData] = useState({ payments: [], summary: {}, pagination: {} });
    const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    // Redirect PLANNER users - they don't have access to organization-wide payments
    useEffect(() => {
        if (userInfo.role === 'PLANNER') {
            toast.error('You do not have permission to view organization-wide payments');
            navigate('/');
        }
    }, [userInfo.role, navigate]);

    useEffect(() => {
        if (userInfo.role !== 'PLANNER') {
            fetchOutstandingPayments();
        }
    }, [activeTab]);

    const fetchOutstandingPayments = async () => {
        try {
            setLoading(true);
            const typeParam = activeTab === 'all' ? '' : `?type=${activeTab}`;
            const response = await fetch(`http://localhost:5001/api/payments/outstanding${typeParam}`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setPaymentsData({
                    payments: data.data,
                    summary: data.summary,
                    pagination: data.pagination
                });
            } else {
                toast.error(data.error || 'Failed to fetch payments');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPaid = (payment) => {
        setSelectedPayment(payment);
        setShowMarkPaidModal(true);
    };

    const getStatusBadge = (payment) => {
        const statusConfig = {
            paid: { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
            partially_paid: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Partial' },
            pending: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Pending' },
            overdue: { bg: 'bg-red-100', text: 'text-red-700', label: 'Overdue' }
        };

        const config = statusConfig[payment.status] || statusConfig.pending;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const getDaysOverdue = (dueDate) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = today - due;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">Outstanding Payments</h1>
                    <p className="text-slate-500 mt-1">Track pending and overdue payments</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
                        <p className="text-orange-100 text-sm mb-1">Total Outstanding</p>
                        <p className="text-3xl font-bold">₹{(paymentsData.summary.totalOutstanding || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl shadow-lg text-white">
                        <p className="text-red-100 text-sm mb-1">Overdue Amount</p>
                        <p className="text-3xl font-bold">₹{(paymentsData.summary.overdueAmount || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                        <p className="text-purple-100 text-sm mb-1">Overdue Count</p>
                        <p className="text-3xl font-bold">{paymentsData.summary.overdueCount || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
                        <p className="text-blue-100 text-sm mb-1">Total Payments</p>
                        <p className="text-3xl font-bold">{paymentsData.payments.length}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 mb-6">
                    <div className="flex items-center justify-between border-b border-slate-100 p-4">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'all'
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                All Payments
                            </button>
                            <button
                                onClick={() => setActiveTab('client')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'client'
                                    ? 'bg-green-50 text-green-700'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                Client Payments
                            </button>
                            <button
                                onClick={() => setActiveTab('vendor')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'vendor'
                                    ? 'bg-orange-50 text-orange-700'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                Vendor Payments
                            </button>
                            <button
                                onClick={() => setActiveTab('paid')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'paid'
                                    ? 'bg-green-50 text-green-700'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                Paid
                            </button>
                        </div>
                        <button
                            onClick={fetchOutstandingPayments}
                            className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                            <Refresh2 size="20" color="currentColor" />
                        </button>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="p-6">
                            <LoadingSkeleton type="table" count={5} />
                        </div>
                    ) : paymentsData.payments.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MoneyRecive size="32" color="#10b981" variant="Bold" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">All Caught Up!</h3>
                            <p className="text-slate-500">No outstanding payments at the moment</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Event</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Client/Vendor</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Description</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Amount</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Paid</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Outstanding</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Due Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paymentsData.payments.map((payment) => {
                                        const isOverdue = payment.status === 'overdue';
                                        const daysOverdue = getDaysOverdue(payment.dueDate);

                                        return (
                                            <tr
                                                key={payment._id}
                                                className={`hover:bg-slate-50 ${isOverdue ? 'bg-red-50' : ''}`}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="text-sm font-medium text-slate-800">
                                                        {payment.eventId?.eventName || 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {payment.eventId?.eventDate && new Date(payment.eventId.eventDate).toLocaleDateString('en-IN')}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {payment.paymentType === 'client_payment' ? (
                                                        <span className="flex items-center space-x-1 text-green-600">
                                                            <MoneyRecive size="16" color="currentColor" />
                                                            <span className="text-xs">Client</span>
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center space-x-1 text-orange-600">
                                                            <MoneySend size="16" color="currentColor" />
                                                            <span className="text-xs">Vendor</span>
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                    {payment.paymentType === 'client_payment'
                                                        ? payment.clientId?.name || 'N/A'
                                                        : payment.vendorName || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">{payment.description}</td>
                                                <td className="px-4 py-3 text-sm text-right font-medium">₹{payment.amount.toLocaleString('en-IN')}</td>
                                                <td className="px-4 py-3 text-sm text-right text-green-600">₹{payment.paidAmount.toLocaleString('en-IN')}</td>
                                                <td className="px-4 py-3 text-sm text-right font-semibold text-orange-600">
                                                    ₹{(payment.amount - payment.paidAmount).toLocaleString('en-IN')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm text-slate-600">
                                                        {new Date(payment.dueDate).toLocaleDateString('en-IN')}
                                                    </div>
                                                    {isOverdue && (
                                                        <div className="text-xs text-red-600 font-medium">
                                                            {daysOverdue} days overdue
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">{getStatusBadge(payment)}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        {payment.status !== 'paid' && (
                                                            <button
                                                                onClick={() => handleMarkPaid(payment)}
                                                                className="text-green-600 hover:text-green-700 text-xs font-medium"
                                                            >
                                                                Mark Paid
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => navigate(`/events/${payment.eventId?._id}`)}
                                                            className="text-primary-600 hover:text-primary-700"
                                                        >
                                                            <Eye size="16" color="currentColor" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Mark Paid Modal */}
            {showMarkPaidModal && selectedPayment && (
                <MarkPaidModal
                    onClose={() => {
                        setShowMarkPaidModal(false);
                        setSelectedPayment(null);
                    }}
                    onSuccess={() => {
                        setShowMarkPaidModal(false);
                        setSelectedPayment(null);
                        fetchOutstandingPayments();
                    }}
                    payment={selectedPayment}
                />
            )}
        </div>
    );
};

export default OutstandingPayments;
