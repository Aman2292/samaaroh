

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Add, Calendar, Eye, TaskSquare, Element3, ClipboardText, TickCircle, Clock, CloseCircle, Flag, SearchNormal, Refresh } from 'iconsax-react';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';
import EventsKanban from './EventsKanban';
import { toast } from 'react-toastify';
import Select from '../../components/common/Select';
import DatePicker from '../../components/common/DatePicker';

const EventsList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
    const [showFilters, setShowFilters] = useState(false);

    // Filter states
    const [filters, setFilters] = useState({
        status: '',
        eventType: '',
        dateFrom: '',
        dateTo: '',
        plannerId: ''
    });
    const [teamMembers, setTeamMembers] = useState([]);

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    const canCreate = ['PLANNER_OWNER', 'PLANNER'].includes(userInfo.role);
    const canEditStatus = ['PLANNER_OWNER', 'PLANNER'].includes(userInfo.role);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            setError(null);

            const limit = viewMode === 'kanban' ? 100 : 20;

            // Build query string with filters
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(filters.status && { status: filters.status }),
                ...(filters.eventType && { eventType: filters.eventType }),
                ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
                ...(filters.dateTo && { dateTo: filters.dateTo }),
                ...(filters.plannerId && { plannerId: filters.plannerId })
            });

            const response = await fetch(`https://samaaroh-1.onrender.com/api/events?${params}`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();

            if (response.ok) {
                setEvents(data.data);
                setPagination(data.pagination);
            } else {
                setError(data.error || t('events.fetchError') || 'Failed to fetch events');
            }
        } catch (err) {
            setError(t('events.serverError') || 'Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamMembers = async () => {
        try {
            const response = await fetch('https://samaaroh-1.onrender.com/api/team', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setTeamMembers(data.data.filter(member =>
                    ['PLANNER_OWNER', 'PLANNER'].includes(member.role)
                ));
            }
        } catch (error) {
            console.error('Failed to fetch team members:', error);
        }
    };

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [page, viewMode, filters]);

    const handleStatusChange = async (eventId, newStatus) => {
        try {
            const response = await fetch(`https://samaaroh-1.onrender.com/api/events/${eventId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(t('events.statusUpdated') || 'Event status updated');
                // Optimistic update
                setEvents(events.map(e => e._id === eventId ? { ...e, status: newStatus } : e));
            } else {
                toast.error(data.error || t('events.statusUpdateFailed') || 'Failed to update status');
            }
        } catch (error) {
            toast.error(t('common.error') || 'Something went wrong');
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
                        <h1 className="text-3xl font-bold text-slate-800">{t('events.title')}</h1>
                        <p className="text-slate-500 mt-1">{t('events.manage')}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                                title={t('events.listView') || 'List View'}
                            >
                                <TaskSquare size={20} variant={viewMode === 'list' ? 'Bold' : 'Outline'} color="currentColor" />
                            </button>
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                                title={t('events.kanbanView') || 'Kanban View'}
                            >
                                <Element3 size={20} variant={viewMode === 'kanban' ? 'Bold' : 'Outline'} color="currentColor" />
                            </button>
                        </div>
                        {canCreate && (
                            <button onClick={() => navigate('/events/create')} className="flex items-center space-x-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
                                <Add size="20" color="currentColor" />
                                <span>{t('events.createEvent')}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters Section */}
                <div className="mb-6">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors mb-4"
                    >
                        <SearchNormal size={20} />
                        <span>{showFilters ? t('events.hideFilters') : t('events.showFilters')}</span>
                    </button>

                    {showFilters && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('common.status')}</label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        <option value="">{t('events.allStatuses')}</option>
                                        <option value="pending">{t('events.pending')}</option>
                                        <option value="confirmed">{t('events.confirmed')}</option>
                                        <option value="in_progress">{t('events.inProgress')}</option>
                                        <option value="completed">{t('common.completed')}</option>
                                        <option value="cancelled">{t('events.cancelled')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('events.eventType')}</label>
                                    <select
                                        value={filters.eventType}
                                        onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        <option value="">{t('events.allTypes')}</option>
                                        <option value="wedding">{t('events.wedding')}</option>
                                        <option value="corporate">{t('events.corporate')}</option>
                                        <option value="birthday">{t('events.birthday')}</option>
                                        <option value="anniversary">{t('events.anniversary')}</option>
                                        <option value="other">{t('events.other')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('events.fromDate')}</label>
                                    <input
                                        type="date"
                                        value={filters.dateFrom}
                                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('events.toDate')}</label>
                                    <input
                                        type="date"
                                        value={filters.dateTo}
                                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>

                                {userInfo.role === 'PLANNER_OWNER' && teamMembers.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('events.assignedPlanner')}</label>
                                        <select
                                            value={filters.plannerId}
                                            onChange={(e) => setFilters({ ...filters, plannerId: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            <option value="">{t('events.allPlanners')}</option>
                                            {teamMembers.map(member => (
                                                <option key={member._id} value={member._id}>{member.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-slate-200">
                                <button
                                    onClick={() => setFilters({ status: '', eventType: '', dateFrom: '', dateTo: '', plannerId: '' })}
                                    className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                                >
                                    <Refresh size={18} />
                                    <span>{t('events.clearFilters')}</span>
                                </button>
                                <div className="text-sm text-slate-500">
                                    {t('events.eventsFound', { count: events.length })}
                                </div>
                            </div>
                        </div>
                    )}
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
                            <h3 className="text-sm font-medium text-blue-800">{t('events.viewingAssigned')}</h3>
                            <p className="text-sm text-blue-700 mt-1">
                                {t('events.plannerOnlyDesc')}
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
                            <h3 className="text-sm font-medium text-blue-800">{t('events.readOnlyAccess')}</h3>
                            <p className="text-sm text-blue-700 mt-1">
                                {t('events.financeOnlyDesc')}
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
                        title={t('events.noEventsFound')}
                        description={t('events.getStarted')}
                        actionLabel={canCreate ? t('events.createFirstEvent') : undefined}
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
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('events.eventName')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('clients.title')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('events.eventDate')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('events.eventType')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('common.status')}</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">{t('common.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {events.map((event) => (
                                            <tr key={event._id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-800">{event.eventName}</div>
                                                    <div className="text-sm text-slate-500">{event.venue || t('dashboard.noVenue')}</div>
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
                                                        <span>{t('dashboard.view')}</span>
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
                                    {t('events.showing', { from: ((pagination.page - 1) * pagination.limit) + 1, to: Math.min(pagination.page * pagination.limit, pagination.total), total: pagination.total })}
                                </p>
                                <div className="flex space-x-2">
                                    <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                        {t('common.previous')}
                                    </button>
                                    <button onClick={() => setPage(page + 1)} disabled={page === pagination.pages} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                        {t('common.next')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div >
    );
};

export default EventsList;
