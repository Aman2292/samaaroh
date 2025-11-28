import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Eye } from 'iconsax-react';

const RecentEventsTable = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        fetchRecentEvents();
    }, []);

    const fetchRecentEvents = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/events?page=1&limit=5', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setEvents(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch recent events:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            lead: 'bg-blue-100 text-blue-700',
            booked: 'bg-green-100 text-green-700',
            in_progress: 'bg-yellow-100 text-yellow-700',
            completed: 'bg-gray-100 text-gray-700',
            cancelled: 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Recent Events</h2>
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-slate-100 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">Recent Events</h2>
                <p className="text-sm text-slate-500 mt-1">Your last 5 events</p>
            </div>

            {events.length === 0 ? (
                <div className="p-12 text-center">
                    <Calendar size="64" color="#cbd5e1" className="mx-auto mb-4" />
                    <p className="text-slate-500">No events assigned yet</p>
                    <p className="text-sm text-slate-400 mt-1">Events assigned to you will appear here</p>
                </div>
            ) : (
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Event Name</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Client</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {events.map((event) => (
                            <tr key={event._id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-800">{event.eventName}</div>
                                    <div className="text-sm text-slate-500">{event.venue || 'No venue'}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    {event.clientId?.name || 'N/A'}
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    {new Date(event.eventDate).toLocaleDateString('en-IN')}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                                        {event.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => navigate(`/events/${event._id}`)}
                                        className="text-primary-600 hover:text-primary-800 transition-colors inline-flex items-center space-x-1"
                                    >
                                        <Eye size="16" color="currentColor" />
                                        <span>View</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default RecentEventsTable;
