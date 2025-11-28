import React from 'react';
import { Calendar, TrendUp, CalendarTick } from 'iconsax-react';

const PlannerWidgets = ({ stats, loading }) => {
    return (
        <>
            {/* My Events Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">My Events</p>
                        <p className="text-3xl font-bold text-slate-800 mt-2">
                            {loading ? '...' : (stats.myEvents || stats.eventsThisMonth || 0)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Total events assigned to you</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <Calendar size="32" color="#3b82f6" variant="Bold" />
                    </div>
                </div>
            </div>

            {/* Upcoming Events Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Upcoming Events</p>
                        <p className="text-3xl font-bold text-slate-800 mt-2">
                            {loading ? '...' : (stats.upcomingEvents || 0)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">In the next 7 days</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                        <TrendUp size="32" color="#f97316" variant="Bold" />
                    </div>
                </div>
            </div>

            {/* Events This Month Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Events This Month</p>
                        <p className="text-3xl font-bold text-slate-800 mt-2">
                            {loading ? '...' : (stats.eventsThisMonth || 0)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Current month</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                        <CalendarTick size="32" color="#10b981" variant="Bold" />
                    </div>
                </div>
            </div>
        </>
    );
};

export default PlannerWidgets;
