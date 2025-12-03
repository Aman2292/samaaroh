import React from 'react';
import { User, TickCircle, People, Add, TaskSquare } from 'iconsax-react';

const GuestSummaryCards = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-sm text-white">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium opacity-90">Total Invited</h3>
                    <User size="24" color="#ffffff" variant="Bold" />
                </div>
                <p className="text-3xl font-bold">{stats.totalInvited || 0}</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-sm text-white">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium opacity-90">Confirmed</h3>
                    <TickCircle size="24" color="#ffffff" variant="Bold" />
                </div>
                <p className="text-3xl font-bold">{stats.totalConfirmed || 0}</p>
            </div>

            <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-6 rounded-xl shadow-sm text-white">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium opacity-90">Checked In</h3>
                    <TaskSquare size="24" color="#ffffff" variant="Bold" />
                </div>
                <p className="text-3xl font-bold">{stats.checkedIn || 0}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-sm text-white">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium opacity-90">Expected Headcount</h3>
                    <People size="24" color="#ffffff" variant="Bold" />
                </div>
                <p className="text-3xl font-bold">{stats.expectedHeadcount || 0}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-sm text-white">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium opacity-90">On-site Added</h3>
                    <Add size="24" color="#ffffff" variant="Bold" />
                </div>
                <p className="text-3xl font-bold">{stats.onsiteAdded || 0}</p>
            </div>
        </div>
    );
};

export default GuestSummaryCards;
