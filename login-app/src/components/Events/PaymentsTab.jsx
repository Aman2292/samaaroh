import React, { useState, useEffect } from 'react';
import { Add, MoneyRecive, MoneySend, Edit2, Trash, Refresh, Copy, Danger, Timer1 } from 'iconsax-react';
import AddPaymentModal from '../Payments/AddPaymentModal';
import MarkPaidModal from '../Payments/MarkPaidModal';
import LoadingSkeleton from '../common/LoadingSkeleton';
import { toast } from 'react-toastify';

const PaymentsTab = ({ eventId, clientId, eventName, clientName }) => {
    const [loading, setLoading] = useState(true);
    const [paymentsData, setPaymentsData] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    const canManagePayments = ['PLANNER_OWNER', 'PLANNER', 'FINANCE'].includes(userInfo.role);

    useEffect(() => {
        fetchPayments();
    }, [eventId]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5001/api/payments/event/${eventId}`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setPaymentsData(data.data);
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

    const handleDelete = async (paymentId) => {
        if (!window.confirm('Are you sure you want to delete this payment?')) return;

        try {
            const response = await fetch(`http://localhost:5001/api/payments/${paymentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Payment deleted successfully');
                fetchPayments();
            } else {
                toast.error(data.error || 'Failed to delete payment');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        }
    };

    const handleCopyReminder = (payment) => {
        const remaining = payment.amount - payment.paidAmount;
        const text = `Hi ${clientName || 'Client'}, your pending payment of ₹${remaining.toLocaleString('en-IN')} for ${eventName || 'your event'} is due. Please clear it at the earliest.`;
        navigator.clipboard.writeText(text);
        toast.success('Reminder copied to clipboard!');
    };

    const isPaymentOverdue = (payment) => {
        return payment.status !== 'paid' && new Date(payment.dueDate) < new Date();
    };

    const getDaysOverdue = (dueDate) => {
        const diff = new Date() - new Date(dueDate);
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    };

    const getStatusBadge = (payment) => {
        const overdue = isPaymentOverdue(payment);

        const statusConfig = {
            paid: { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
            partially_paid: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Partial' },
            pending: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Pending' },
        };

        let config = statusConfig[payment.status] || statusConfig.pending;

        // Override for overdue
        if (overdue) {
            config = { bg: 'bg-red-100', text: 'text-red-700', label: 'Overdue' };
        }

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    if (loading) {
        return <LoadingSkeleton type="table" count={3} />;
    }

    if (!paymentsData) {
        return (
            <div className="text-center py-8">
                <p className="text-slate-500">Failed to load payments</p>
                <button onClick={fetchPayments} className="mt-4 text-primary-600 hover:text-primary-700">
                    Try Again
                </button>
            </div>
        );
    }

    const { clientPayments, vendorPayments, summary } = paymentsData;

    // Filter upcoming due payments (within 3 days)
    const upcomingPayments = clientPayments.filter(p => {
        if (p.status === 'paid') return false;
        const diffTime = new Date(p.dueDate) - new Date();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 3;
    });

    return (
        <div className="space-y-6">

            {/* 1. Payment Reminder Banner */}
            {upcomingPayments.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg flex items-start">
                    <Timer1 size="24" className="text-yellow-600 mr-3 mt-0.5" variant="Bold" />
                    <div>
                        <h4 className="text-sm font-bold text-yellow-800 uppercase">Upcoming Payments</h4>
                        <div className="mt-1 text-sm text-yellow-700">
                            {upcomingPayments.map(p => (
                                <p key={p._id}>
                                    Payment of <strong>₹{(p.amount - p.paidAmount).toLocaleString('en-IN')}</strong> for {p.description} is due in
                                    <strong> {Math.ceil((new Date(p.dueDate) - new Date()) / (1000 * 60 * 60 * 24))} days</strong>.
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-600 mb-1">Client Total</p>
                    <p className="text-2xl font-bold text-blue-700">₹{summary.clientTotal.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <p className="text-xs text-green-600 mb-1">Client Collected</p>
                    <p className="text-2xl font-bold text-green-700">₹{summary.clientPaid.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                    <p className="text-xs text-orange-600 mb-1">Vendor Paid</p>
                    <p className="text-2xl font-bold text-orange-700">₹{summary.vendorPaid.toLocaleString('en-IN')}</p>
                </div>
                <div className={`p-4 rounded-lg border ${summary.netBalance >= 0 ? 'bg-purple-50 border-purple-100' : 'bg-red-50 border-red-100'}`}>
                    <p className={`text-xs mb-1 ${summary.netBalance >= 0 ? 'text-purple-600' : 'text-red-600'}`}>Net Balance</p>
                    <p className={`text-2xl font-bold ${summary.netBalance >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
                        ₹{summary.netBalance.toLocaleString('en-IN')}
                    </p>
                </div>
            </div>

            {/* Client Payments Section */}
            <div className="bg-white rounded-xl border border-slate-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div className="flex items-center space-x-2">
                        <MoneyRecive size="20" color="#10b981" variant="Bold" />
                        <h3 className="font-semibold text-slate-800">Client Payments</h3>
                    </div>
                    {canManagePayments && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                            <Add size="16" color="currentColor" />
                            <span>Add Payment</span>
                        </button>
                    )}
                </div>

                {clientPayments.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        <p>No client payments added yet</p>
                        {canManagePayments && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="mt-2 text-primary-600 hover:text-primary-700 text-sm"
                            >
                                Add first payment
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Description</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Due Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Paid</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Outstanding</th>
                                    {canManagePayments && <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {clientPayments.map((payment) => {
                                    const isOverdue = isPaymentOverdue(payment);
                                    const daysOverdue = isOverdue ? getDaysOverdue(payment.dueDate) : 0;

                                    return (
                                        <tr key={payment._id} className={`hover:bg-slate-50 ${isOverdue ? 'bg-red-50/50' : ''}`}>
                                            <td className="px-4 py-3 text-sm text-slate-800">
                                                {payment.description}
                                                {isOverdue && daysOverdue > 0 && (
                                                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                        Overdue {daysOverdue}d
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-medium">₹{payment.amount.toLocaleString('en-IN')}</td>
                                            <td className={`px-4 py-3 text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                                                {new Date(payment.dueDate).toLocaleDateString('en-IN')}
                                            </td>
                                            <td className="px-4 py-3">{getStatusBadge(payment)}</td>
                                            <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">₹{payment.paidAmount.toLocaleString('en-IN')}</td>
                                            <td className="px-4 py-3 text-sm text-right text-orange-600 font-medium">₹{(payment.amount - payment.paidAmount).toLocaleString('en-IN')}</td>
                                            {canManagePayments && (
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        {payment.status !== 'paid' && (
                                                            <button
                                                                onClick={() => handleCopyReminder(payment)}
                                                                className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                                title="Copy WhatsApp Reminder"
                                                            >
                                                                <Copy size="16" color="currentColor" />
                                                            </button>
                                                        )}
                                                        {payment.status !== 'paid' && (
                                                            <button
                                                                onClick={() => handleMarkPaid(payment)}
                                                                className="text-green-600 hover:text-green-700 text-xs font-medium"
                                                            >
                                                                Mark Paid
                                                            </button>
                                                        )}
                                                        {userInfo.role === 'PLANNER_OWNER' && (
                                                            <button
                                                                onClick={() => handleDelete(payment._id)}
                                                                className="text-red-600 hover:text-red-700"
                                                            >
                                                                <Trash size="16" color="currentColor" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                                <tr className="bg-slate-50 font-semibold">
                                    <td className="px-4 py-3 text-sm">Total</td>
                                    <td className="px-4 py-3 text-sm text-right">₹{summary.clientTotal.toLocaleString('en-IN')}</td>
                                    <td colSpan="2"></td>
                                    <td className="px-4 py-3 text-sm text-right text-green-600">₹{summary.clientPaid.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-sm text-right text-orange-600">₹{summary.clientOutstanding.toLocaleString('en-IN')}</td>
                                    {canManagePayments && <td></td>}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Vendor Payments Section (Unchanged mostly, but could apply logic if needed) */}
            <div className="bg-white rounded-xl border border-slate-200">
                {/* ... Header ... */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div className="flex items-center space-x-2">
                        <MoneySend size="20" color="#f59e0b" variant="Bold" />
                        <h3 className="font-semibold text-slate-800">Vendor Payments</h3>
                    </div>
                    {canManagePayments && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center space-x-2 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                        >
                            <Add size="16" color="currentColor" />
                            <span>Add Payment</span>
                        </button>
                    )}
                </div>

                {vendorPayments.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        <p>No vendor payments added yet</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Vendor</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Category</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Description</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Due Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Paid</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Outstanding</th>
                                    {canManagePayments && <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {vendorPayments.map((payment) => (
                                    <tr key={payment._id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 text-sm font-medium text-slate-800">{payment.vendorName}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded capitalize">
                                                {payment.vendorCategory}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{payment.description}</td>
                                        <td className="px-4 py-3 text-sm text-right font-medium">₹{payment.amount.toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{new Date(payment.dueDate).toLocaleDateString('en-IN')}</td>
                                        <td className="px-4 py-3">{getStatusBadge(payment)}</td>
                                        <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">₹{payment.paidAmount.toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-3 text-sm text-right text-orange-600 font-medium">₹{(payment.amount - payment.paidAmount).toLocaleString('en-IN')}</td>
                                        {canManagePayments && (
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
                                                    {userInfo.role === 'PLANNER_OWNER' && (
                                                        <button
                                                            onClick={() => handleDelete(payment._id)}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash size="16" color="currentColor" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {/* ... Total Row ... */}
                                <tr className="bg-slate-50 font-semibold">
                                    <td colSpan="3" className="px-4 py-3 text-sm">Total</td>
                                    <td className="px-4 py-3 text-sm text-right">₹{summary.vendorTotal.toLocaleString('en-IN')}</td>
                                    <td colSpan="2"></td>
                                    <td className="px-4 py-3 text-sm text-right text-green-600">₹{summary.vendorPaid.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-sm text-right text-orange-600">₹{summary.vendorOutstanding.toLocaleString('en-IN')}</td>
                                    {canManagePayments && <td></td>}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals ... */}
            {showAddModal && (
                <AddPaymentModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        fetchPayments();
                    }}
                    eventId={eventId}
                    clientId={clientId}
                />
            )}

            {showMarkPaidModal && selectedPayment && (
                <MarkPaidModal
                    onClose={() => {
                        setShowMarkPaidModal(false);
                        setSelectedPayment(null);
                    }}
                    onSuccess={() => {
                        setShowMarkPaidModal(false);
                        setSelectedPayment(null);
                        fetchPayments();
                    }}
                    payment={selectedPayment}
                />
            )}
        </div>
    );
};

export default PaymentsTab;
