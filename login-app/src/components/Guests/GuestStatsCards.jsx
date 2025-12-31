import React from 'react';
import { UserTick, UserRemove, Clock, People } from 'iconsax-react';

const GuestStatsCards = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-blue-100 text-sm">Total Guests</p>
                    <People size="24" variant="Bold" />
                </div>
                <p className="text-3xl font-bold">{stats.total || 0}</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-green-100 text-sm">Attending</p>
                    <UserTick size="24" variant="Bold" />
                </div>
                <p className="text-3xl font-bold">{stats.attending || 0}</p>
                <p className="text-xs text-green-100 mt-1">
                    Expected: {stats.expectedHeadcount || 0}
                </p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-orange-100 text-sm">Pending</p>
                    <Clock size="24" variant="Bold" />
                </div>
                <p className="text-3xl font-bold">{stats.pending || 0}</p>
                <p className="text-xs text-orange-100 mt-1">
                    RSVP Rate: {stats.rsvpRate || 0}%
                </p>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl shadow-lg text-white">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-red-100 text-sm">Not Attending</p>
                    <UserRemove size="24" variant="Bold" />
                </div>
                <p className="text-3xl font-bold">{stats.notAttending || 0}</p>
            </div>
        </div>
    );
};

export default GuestStatsCards;
