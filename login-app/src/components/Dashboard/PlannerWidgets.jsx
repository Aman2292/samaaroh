import React from 'react';
import { Calendar, Category } from 'iconsax-react';

const PlannerWidgets = ({ stats, loading }) => {
    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-600">My Events</h3>
                    <Category size="24" className="text-primary-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900">
                    {loading ? '...' : stats.eventsThisMonth}
                </div>
                <p className="text-xs text-slate-500 mt-1">Where you are lead planner</p>
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
        </>
    );
};

export default PlannerWidgets;
