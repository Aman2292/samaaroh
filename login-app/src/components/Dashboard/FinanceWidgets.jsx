import React from 'react';
import { Calendar, MoneyRecive, TrendUp } from 'iconsax-react';

const FinanceWidgets = ({ stats, loading }) => {
    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-600">Total Events</h3>
                    <Calendar size="24" className="text-primary-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900">
                    {loading ? '...' : stats.eventsThisMonth}
                </div>
                <p className="text-xs text-slate-500 mt-1">Read-only access</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-600">Upcoming Events</h3>
                    <TrendUp size="24" className="text-green-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900">
                    {loading ? '...' : stats.upcomingEvents}
                </div>
                <p className="text-xs text-slate-500 mt-1">Next 7 days</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-600">Revenue Tracking</h3>
                    <MoneyRecive size="24" className="text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900">
                    Coming Soon
                </div>
                <p className="text-xs text-slate-500 mt-1">Payment tracking</p>
            </div>
        </>
    );
};

export default FinanceWidgets;
