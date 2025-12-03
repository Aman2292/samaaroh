import React from 'react';
import { User } from 'iconsax-react';

const GuestTable = ({ guests, loading, onEdit, onDelete, onCheckIn }) => {
    const getRSVPColor = (status) => {
        const colors = {
            invited: 'bg-gray-100 text-gray-700',
            confirmed: 'bg-green-100 text-green-700',
            declined: 'bg-red-100 text-red-700',
            tentative: 'bg-yellow-100 text-yellow-700',
            checked_in: 'bg-blue-100 text-blue-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Side</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Group</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">RSVP</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Headcount</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-4 text-center text-slate-500">Loading...</td>
                            </tr>
                        ) : guests.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center">
                                    <User size="48" color="#cbd5e1" variant="Outline" className="mx-auto mb-3" />
                                    <p className="text-slate-500">No guests found</p>
                                    <p className="text-sm text-slate-400">Add guests to get started</p>
                                </td>
                            </tr>
                        ) : (
                            guests.map((guest) => (
                                <tr key={guest._id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div>
                                                <div className="font-medium text-slate-900">{guest.name}</div>
                                                {guest.addedOnsite && (
                                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">On-site</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{guest.phone || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{guest.side}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{guest.group}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getRSVPColor(guest.rsvpStatus)}`}>
                                            {guest.rsvpStatus.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{guest.headcount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        {guest.rsvpStatus !== 'checked_in' ? (
                                            <button
                                                onClick={() => onCheckIn(guest._id)}
                                                className="text-blue-600 hover:text-blue-800 mr-3 font-medium"
                                            >
                                                Check In
                                            </button>
                                        ) : (
                                            <span className="text-green-600 mr-3 font-medium inline-flex items-center gap-1">
                                                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                                                Checked In
                                            </span>
                                        )}
                                        <button
                                            onClick={() => onEdit(guest)}
                                            className="text-slate-600 hover:text-slate-800 mr-3"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => onDelete(guest)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GuestTable;
