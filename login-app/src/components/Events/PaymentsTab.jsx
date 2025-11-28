import React, { useState, useEffect } from 'react';
import { Add, MoneyRecive, MoneySend, Edit2, Trash, Refresh } from 'iconsax-react';
import AddPaymentModal from '../Payments/AddPaymentModal';
import MarkPaidModal from '../Payments/MarkPaidModal';
import LoadingSkeleton from '../common/LoadingSkeleton';
import { toast } from 'react-toastify';

const PaymentsTab = ({ eventId, clientId }) => {
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

    const getStatusBadge = (payment) => {
        const outstandingAmount = payment.amount - payment.paidAmount;

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

    return (
        <div className="space-y-6">
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
                                {clientPayments.map((payment) => (
                                    <tr key={payment._id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 text-sm text-slate-800">{payment.description}</td>
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

            {/* Vendor Payments Section */}
            <div className="bg-white rounded-xl border border-slate-200">
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

            {/* Modals */}
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
