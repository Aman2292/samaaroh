import React from 'react';
import { User, Calendar, Category, TrendUp } from 'iconsax-react';

const PlannerOwnerWidgets = ({ stats, loading }) => {
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
        </>
    );
};

export default PlannerOwnerWidgets;
