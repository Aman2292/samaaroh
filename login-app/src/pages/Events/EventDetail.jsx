import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Location } from 'iconsax-react';
import PaymentsTab from '../../components/Events/PaymentsTab';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { toast } from 'react-toastify';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        fetchEventDetails();
    }, [id]);

    const fetchEventDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5001/api/events/${id}`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setEvent(data.data);
            } else {
                toast.error(data.error || 'Failed to fetch event details');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <LoadingSkeleton type="card" count={1} />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="p-8 text-center">
                <p className="text-slate-500">Event not found</p>
                <button onClick={() => navigate('/events')} className="mt-4 text-primary-600 hover:text-primary-700">
                    Back to Events
                </button>
            </div>
        );
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            lead: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Lead' },
            booked: { bg: 'bg-green-100', text: 'text-green-700', label: 'Booked' },
            in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'In Progress' },
            completed: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Completed' },
            cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' }
        };

        const config = statusConfig[status] || statusConfig.lead;
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/events')}
                        className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 mb-4"
                    >
                        <ArrowLeft size="20" color="currentColor" />
                        <span>Back to Events</span>
                    </button>

                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">{event.eventName}</h1>
                            <div className="flex items-center space-x-4 mt-2 text-slate-600">
                                <div className="flex items-center space-x-2">
                                    <User size="16" color="currentColor" />
                                    <span className="text-sm">{event.clientId?.name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Calendar size="16" color="currentColor" />
                                    <span className="text-sm">{new Date(event.eventDate).toLocaleDateString('en-IN')}</span>
                                </div>
                                {event.venue && (
                                    <div className="flex items-center space-x-2">
                                        <Location size="16" color="currentColor" />
                                        <span className="text-sm">{event.venue}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            {getStatusBadge(event.status)}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100">
                    <div className="border-b border-slate-200">
                        <div className="flex space-x-1 p-2">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'overview'
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('payments')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'payments'
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                Payments
                            </button>
                            <button
                                disabled
                                className="px-4 py-2 rounded-lg font-medium text-slate-400 cursor-not-allowed"
                            >
                                Tasks (Coming Soon)
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Event Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Event Type</label>
                                        <p className="text-slate-800 capitalize">{event.eventType}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Event Date</label>
                                        <p className="text-slate-800">{new Date(event.eventDate).toLocaleDateString('en-IN', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Venue</label>
                                        <p className="text-slate-800">{event.venue || 'Not specified'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Estimated Budget</label>
                                        <p className="text-slate-800">
                                            {event.estimatedBudget ? `₹${event.estimatedBudget.toLocaleString('en-IN')}` : 'Not specified'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Lead Planner</label>
                                        <p className="text-slate-800">{event.leadPlannerId?.name || 'Not assigned'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Status</label>
                                        <div>{getStatusBadge(event.status)}</div>
                                    </div>
                                </div>

                                {/* Notes */}
                                {event.notes && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Notes</label>
                                        <p className="text-slate-800 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg">{event.notes}</p>
                                    </div>
                                )}

                                {/* Client Details */}
                                <div className="border-t border-slate-200 pt-6">
                                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Client Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-1">Name</label>
                                            <p className="text-slate-800">{event.clientId?.name}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-1">Phone</label>
                                            <p className="text-slate-800">{event.clientId?.phone}</p>
                                        </div>
                                        {event.clientId?.email && (
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
                                                <p className="text-slate-800">{event.clientId.email}</p>
                                            </div>
                                        )}
                                        {event.clientId?.city && (
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 mb-1">City</label>
                                                <p className="text-slate-800">{event.clientId.city}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'payments' && (
                            <PaymentsTab eventId={event._id} clientId={event.clientId?._id} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetail;
