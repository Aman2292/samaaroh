import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoneyRecive, MoneySend, TrendUp, Danger } from 'iconsax-react';

const FinanceWidgets = ({ stats, loading }) => {
    const navigate = useNavigate();
    const [paymentStats, setPaymentStats] = useState(null);
    const [loadingPayments, setLoadingPayments] = useState(true);

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
        } finally {
            setLoadingPayments(false);
        }
    };

    if (loading || loadingPayments) {
        return (
            <>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 animate-pulse">
                        <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                        <div className="h-8 bg-slate-200 rounded w-3/4"></div>
                    </div>
                ))}
            </>
        );
    }

    return (
        <>
            {/* Total Revenue */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-blue-100">Total Revenue</h3>
                    <MoneyRecive size="24" color="currentColor" variant="Bold" />
                </div>
                <div className="text-3xl font-bold">₹{(paymentStats?.totalExpected || 0).toLocaleString('en-IN')}</div>
                <p className="text-xs text-blue-100 mt-1">Expected from clients</p>
            </div>

            {/* Collected Amount */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-green-100">Collected</h3>
                    <TrendUp size="24" color="currentColor" variant="Bold" />
                </div>
                <div className="text-3xl font-bold">₹{(paymentStats?.totalCollected || 0).toLocaleString('en-IN')}</div>
                <p className="text-xs text-green-100 mt-1">
                    {paymentStats?.collectionRate || 0}% collection rate
                </p>
            </div>

            {/* Outstanding */}
            <div
                onClick={() => navigate('/payments/outstanding?type=client')}
                className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white cursor-pointer hover:shadow-xl transition-shadow"
            >
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-orange-100">Outstanding</h3>
                    <Danger size="24" color="currentColor" variant="Bold" />
                </div>
                <div className="text-3xl font-bold">₹{(paymentStats?.outstandingAmount || 0).toLocaleString('en-IN')}</div>
                <p className="text-xs text-orange-100 mt-1">
                    {paymentStats?.overdueCount || 0} overdue payments
                </p>
            </div>

            {/* Vendor Payments Due */}
            <div
                onClick={() => navigate('/payments/outstanding?type=vendor')}
                className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white cursor-pointer hover:shadow-xl transition-shadow"
            >
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-purple-100">Vendor Dues</h3>
                    <MoneySend size="24" color="currentColor" variant="Bold" />
                </div>
                <div className="text-3xl font-bold">₹{(paymentStats?.vendorDue || 0).toLocaleString('en-IN')}</div>
                <p className="text-xs text-purple-100 mt-1">Pending vendor payments</p>
            </div>
        </>
    );
};

export default FinanceWidgets;
