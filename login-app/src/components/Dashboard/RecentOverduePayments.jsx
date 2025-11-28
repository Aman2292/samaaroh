import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Danger, Eye, Calendar } from 'iconsax-react';

const RecentOverduePayments = () => {
    const navigate = useNavigate();
    const [overduePayments, setOverduePayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        fetchOverduePayments();
    }, []);

    const fetchOverduePayments = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/payments/outstanding?status=overdue&limit=5', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setOverduePayments(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch overdue payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDaysOverdue = (dueDate) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = today - due;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Recent Overdue Payments</h2>
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-slate-100 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (overduePayments.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Recent Overdue Payments</h2>
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Calendar size="32" color="#10b981" variant="Bold" />
                    </div>
                    <p className="text-slate-600">No overdue payments</p>
                    <p className="text-sm text-slate-500 mt-1">All payments are on track!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Recent Overdue Payments</h2>
                    <p className="text-sm text-slate-500 mt-1">Top 5 overdue payments requiring attention</p>
                </div>
                <button
                    onClick={() => navigate('/payments/outstanding?status=overdue')}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                    View All →
                </button>
            </div>

            <table className="w-full">
                <thead className="bg-red-50 border-b border-red-100">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-red-800 uppercase">Event</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-red-800 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-red-800 uppercase">Client/Vendor</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-red-800 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-red-800 uppercase">Days Overdue</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-red-800 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-red-100">
                    {overduePayments.map((payment) => {
                        const daysOverdue = getDaysOverdue(payment.dueDate);
                        return (
                            <tr key={payment._id} className="bg-red-50 hover:bg-red-100 transition-colors">
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => navigate(`/events/${payment.eventId?._id}`)}
                                        className="text-sm font-medium text-primary-600 hover:text-primary-800 text-left"
                                    >
                                        {payment.eventId?.eventName || 'N/A'}
                                    </button>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {payment.eventId?.eventDate && new Date(payment.eventId.eventDate).toLocaleDateString('en-IN')}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.paymentType === 'client_payment'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-orange-100 text-orange-700'
                                        }`}>
                                        {payment.paymentType === 'client_payment' ? 'Client' : 'Vendor'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-700">
                                    {payment.paymentType === 'client_payment'
                                        ? payment.clientId?.name || 'N/A'
                                        : payment.vendorName || 'N/A'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="text-sm font-bold text-red-600">
                                        ₹{payment.amount.toLocaleString('en-IN')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-red-700">
                                        {daysOverdue} days overdue
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button
                                            onClick={() => navigate(`/events/${payment.eventId?._id}`)}
                                            className="text-primary-600 hover:text-primary-800 transition-colors"
                                        >
                                            <Eye size="18" color="currentColor" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default RecentOverduePayments;
