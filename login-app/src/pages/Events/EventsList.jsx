
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Add, Calendar, Eye, TaskSquare, Element3, ClipboardText, TickCircle, Clock, CloseCircle, Flag } from 'iconsax-react';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';
import EventsKanban from './EventsKanban';
import { toast } from 'react-toastify';
import Select from '../../components/common/Select';

const EventsList = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    const canCreate = ['PLANNER_OWNER', 'PLANNER'].includes(userInfo.role);
    const canEditStatus = ['PLANNER_OWNER', 'PLANNER'].includes(userInfo.role);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            setError(null);

            const limit = viewMode === 'kanban' ? 100 : 20;

            const response = await fetch(`http://localhost:5001/api/events?page=${page}&limit=${limit}`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();

            if (response.ok) {
                setEvents(data.data);
                setPagination(data.pagination);
            } else {
                setError(data.error || 'Failed to fetch events');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [page, viewMode]);

    const handleStatusChange = async (eventId, newStatus) => {
        try {
            const response = await fetch(`http://localhost:5001/api/events/${eventId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Event status updated');
                // Optimistic update
                setEvents(events.map(e => e._id === eventId ? { ...e, status: newStatus } : e));
            } else {
                toast.error(data.error || 'Failed to update status');
            }
        } catch (error) {
            toast.error('Something went wrong');
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

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Events</h1>
                        <p className="text-slate-500 mt-1">Manage your events</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                                title="List View"
                            >
                                <TaskSquare size="20" variant={viewMode === 'list' ? 'Bold' : 'Outline'} />
                            </button>
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                                title="Kanban View"
                            >
                                <Element3 size="20" variant={viewMode === 'kanban' ? 'Bold' : 'Outline'} />
                            </button>
                        </div>
                        {canCreate && (
                            <button onClick={() => navigate('/events/create')} className="flex items-center space-x-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
                                <Add size="20" color="currentColor" />
                                <span>Create Event</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* PLANNER Notice Banner */}
                {userInfo.role === 'PLANNER' && (
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-blue-800">Viewing Your Assigned Events</h3>
                            <p className="text-sm text-blue-700 mt-1">
                                You are viewing only events where you are the lead planner. Other events in your organization are not visible to you.
                            </p>
                        </div>
                    </div>
                )}

                {/* FINANCE Read-Only Banner */}
                {userInfo.role === 'FINANCE' && (
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-blue-800">Read-Only Access</h3>
                            <p className="text-sm text-blue-700 mt-1">
                                You have read-only access to events for financial tracking purposes. Contact your organization owner to make changes.
                            </p>
                        </div>
                    </div>
                )}

                {loading ? (
                    <LoadingSkeleton type="table" count={5} />
                ) : error ? (
                    <ErrorMessage message={error} onRetry={fetchEvents} />
                ) : events.length === 0 ? (
                    <EmptyState
                        icon={Calendar}
                        title="No events found"
                        description="Get started by creating your first event"
                        actionLabel={canCreate ? "+ Create First Event" : undefined}
                        onAction={canCreate ? () => navigate('/events/create') : undefined}
                    />
                ) : (
                    <>
                        {viewMode === 'kanban' ? (
                            <EventsKanban
                                events={events}
                                onStatusChange={handleStatusChange}
                                canEdit={canEditStatus}
                            />
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Event Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Client</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
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
                                                    <span className="capitalize text-slate-600">{event.eventType}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {canEditStatus ? (
                                                        <Select
                                                            value={event.status}
                                                            onChange={(e) => handleStatusChange(event._id, e.target.value)}
                                                            options={[
                                                                {
                                                                    value: 'lead',
                                                                    label: 'Lead',
                                                                    icon: Flag,
                                                                    bgColor: '#DBEAFE',
                                                                    textColor: '#1E40AF'
                                                                },
                                                                {
                                                                    value: 'booked',
                                                                    label: 'Booked',
                                                                    icon: ClipboardText,
                                                                    bgColor: '#D1FAE5',
                                                                    textColor: '#065F46'
                                                                },
                                                                {
                                                                    value: 'in_progress',
                                                                    label: 'In Progress',
                                                                    icon: Clock,
                                                                    bgColor: '#FEF3C7',
                                                                    textColor: '#92400E'
                                                                },
                                                                {
                                                                    value: 'completed',
                                                                    label: 'Completed',
                                                                    icon: TickCircle,
                                                                    bgColor: '#E0E7FF',
                                                                    textColor: '#3730A3'
                                                                },
                                                                {
                                                                    value: 'cancelled',
                                                                    label: 'Cancelled',
                                                                    icon: CloseCircle,
                                                                    bgColor: '#FEE2E2',
                                                                    textColor: '#991B1B'
                                                                }
                                                            ]}
                                                            className="min-w-[140px]"
                                                        />
                                                    ) : (
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                                                            {event.status.replace('_', ' ')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => navigate(`/events/${event._id}`)} className="text-primary-600 hover:text-primary-800 transition-colors flex items-center justify-end space-x-1">
                                                        <Eye size="16" color="currentColor" />
                                                        <span>View</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {pagination && pagination.pages > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <p className="text-sm text-slate-600">
                                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} events
                                </p>
                                <div className="flex space-x-2">
                                    <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                        Previous
                                    </button>
                                    <button onClick={() => setPage(page + 1)} disabled={page === pagination.pages} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default EventsList;
