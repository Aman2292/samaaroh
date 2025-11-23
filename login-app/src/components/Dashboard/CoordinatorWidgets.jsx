import React from 'react';
import { Calendar, Task } from 'iconsax-react';

const CoordinatorWidgets = ({ stats, loading }) => {
    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-600">Assigned Events</h3>
                    <Calendar size="24" className="text-primary-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900">
                    {loading ? '...' : stats.eventsThisMonth}
                </div>
                <p className="text-xs text-slate-500 mt-1">Events assigned to you</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-600">Upcoming Events</h3>
                    <Task size="24" className="text-green-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900">
                    {loading ? '...' : stats.upcomingEvents}
                </div>
                <p className="text-xs text-slate-500 mt-1">Next 7 days</p>
            </div>
        </>
    );
};

export default CoordinatorWidgets;
