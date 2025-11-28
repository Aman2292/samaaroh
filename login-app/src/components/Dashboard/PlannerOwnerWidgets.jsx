import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, Category, TrendUp, MoneyRecive } from 'iconsax-react';

const PlannerOwnerWidgets = ({ stats, loading }) => {
    const navigate = useNavigate();
    const [paymentStats, setPaymentStats] = useState(null);

    useEffect(() => {
        fetchPaymentStats();
    }, []);

    const fetchPaymentStats = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const response = await fetch('http://localhost:5001/api/payments/stats', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setPaymentStats(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch payment stats:', error);
        }
    };

    const outstandingAmount = paymentStats?.outstandingAmount || 0;
    const isHighOutstanding = outstandingAmount > 100000;
    const isCriticalOutstanding = outstandingAmount > 50000;

    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-600">Total Clients</h3>
                    <User size="24" className="text-primary-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900">
                    {loading ? '...' : stats.totalClients}
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-600">Upcoming Events</h3>
                    <Calendar size="24" className="text-green-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900">
                    {loading ? '...' : stats.upcomingEvents}
                </div>
                <p className="text-xs text-slate-500 mt-1">Next 7 days</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-600">Events This Month</h3>
                    <Category size="24" className="text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900">
                    {loading ? '...' : stats.eventsThisMonth}
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-600">Team Members</h3>
                    <TrendUp size="24" className="text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900">
                    {loading ? '...' : stats.teamMembers || 0}
                </div>
            </div>

            {/* Outstanding Payments Widget */}
            <div
                onClick={() => navigate('/payments/outstanding')}
                className={`p-6 rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition-all ${isHighOutstanding
                        ? 'bg-red-50 border-red-200'
                        : isCriticalOutstanding
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-white border-slate-100'
                    }`}
            >
                <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-semibold ${isHighOutstanding
                            ? 'text-red-700'
                            : isCriticalOutstanding
                                ? 'text-orange-700'
                                : 'text-slate-600'
                        }`}>Outstanding Payments</h3>
                    <MoneyRecive
                        size="24"
                        className={
                            isHighOutstanding
                                ? 'text-red-600'
                                : isCriticalOutstanding
                                    ? 'text-orange-600'
                                    : 'text-slate-600'
                        }
                        variant="Bold"
                    />
                </div>
                <div className={`text-3xl font-bold ${isHighOutstanding
                        ? 'text-red-700'
                        : isCriticalOutstanding
                            ? 'text-orange-700'
                            : 'text-slate-900'
                    }`}>
                    ₹{outstandingAmount.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                    {paymentStats?.overdueCount || 0} overdue • Click to view
                </p>
            </div>
        </>
    );
};

export default PlannerOwnerWidgets;
