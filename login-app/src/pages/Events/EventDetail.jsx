import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Location, Copy, Message, Danger, TickCircle } from 'iconsax-react';
import PaymentsTab from '../../components/Events/PaymentsTab';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import GuestListTab from '../../components/Events/GuestListTab';
import EventTasksTab from '../../components/Events/EventTasksTab';
import { toast } from 'react-toastify';
import TertiaryButton from '../../components/common/TertiaryButton';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
    const features = userInfo.subscribedFeatures || { events: { guests: true, payments: true, tasks: true } };
    const eventFeatures = features.events || { guests: true, payments: true, tasks: true };

    // Super Admin should have read-only access
    const isSuperAdmin = userInfo.role === 'SUPER_ADMIN';
    const isReadOnly = isSuperAdmin;

    useEffect(() => {
        fetchEventDetails();
    }, [id]);

    const fetchEventDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`https://samaaroh-1.onrender.com/api/events/${id}`, {
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

    const handleCopyInvite = () => {
        const text = `Join us for the ${event.eventType} of ${event.clientId?.name} on ${new Date(event.eventDate).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })} at ${event.venue || 'our venue'}. We look forward to celebrating with you!`;
        navigator.clipboard.writeText(text);
        toast.success('Invitation copied!');
    };

    const handleCopyThankYou = () => {
        const text = `Dear ${event.clientId?.name}, thank you for choosing us to plan your ${event.eventType}. It was a pleasure serving you. Please let us know if you need anything else!`;
        navigator.clipboard.writeText(text);
        toast.success('Thank you note copied!');
    };

    const renderVendorAlert = () => {
        // Feature 4: Unconfirmed Vendor Alert
        // Logic: if event is within 3 days and (mock) unconfirmed vendors exist.
        // Since we don't have full vendor data linked here yet, we simulate or check if 'vendors' array exists and has unconfirmed status.
        // For MVP/Demo: We check if date is close (< 7 days) and show a warning if no vendor is confirmed (mock logic if data missing).

        if (!event) return null;
        const diff = new Date(event.eventDate) - new Date();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

        if (days >= 0 && days <= 3) {
            // Mock check: In real app, check event.vendors.some(v => v.status !== 'confirmed')
            return (
                <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start space-x-3">
                    <Danger size="24" className="text-orange-600 mt-0.5" variant="Bold" />
                    <div className="flex-1">
                        <h4 className="text-orange-800 font-bold">Unconfirmed Vendors Alert</h4>
                        <p className="text-orange-700 text-sm mt-1">
                            This event is in {days} days. Please ensure all vendors are confirmed.
                        </p>
                    </div>
                    <button className="text-orange-700 font-medium text-sm hover:underline">
                        View Vendors
                    </button>
                </div>
            );
        }
        return null;
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
                    <TertiaryButton
                        onClick={() => navigate(isSuperAdmin ? '/admin/events' : '/events')}
                        icon={ArrowLeft}
                        className="mb-4 !px-0 hover:bg-transparent hover:translate-x-[-4px]"
                    >
                        {isSuperAdmin ? 'Back to Events' : 'Back to Events'}
                    </TertiaryButton>

                    {/* Super Admin Read-Only Banner */}
                    {isSuperAdmin && (
                        <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start space-x-3">
                            <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-purple-800">Read-Only View</h3>
                                <p className="text-sm text-purple-700 mt-1">
                                    You are viewing this event as Super Admin. You cannot make changes to this event.
                                </p>
                            </div>
                        </div>
                    )}

                    {renderVendorAlert()}

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
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
                        <div className="flex flex-col items-end gap-3">
                            <div className="flex items-center space-x-3">
                                {getStatusBadge(event.status)}
                            </div>

                            {/* Feature 5: Communication Assist / Action Center - Hide for Super Admin */}
                            {!isReadOnly && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleCopyInvite}
                                        className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                                        title="Copy Invitation Message"
                                    >
                                        <Message size="16" />
                                        <span>Copy Invite</span>
                                    </button>
                                    <button
                                        onClick={handleCopyThankYou}
                                        className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                                        title="Copy Thank You Message"
                                    >
                                        <TickCircle size="16" />
                                        <span>Copy Thanks</span>
                                    </button>
                                </div>
                            )}
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
                            {/* Hide edit tabs for Super Admin */}
                            {!isReadOnly && eventFeatures.payments && (
                                <button
                                    onClick={() => setActiveTab('payments')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'payments'
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    Payments
                                </button>
                            )}
                            {!isReadOnly && eventFeatures.guests && (
                                <button
                                    onClick={() => setActiveTab('guests')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'guests'
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    Guest List
                                </button>
                            )}
                            {!isReadOnly && eventFeatures.tasks && (
                                <button
                                    onClick={() => setActiveTab('tasks')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'tasks'
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    Tasks
                                </button>
                            )}
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

                        {activeTab === 'payments' && eventFeatures.payments && (
                            <PaymentsTab
                                eventId={event._id}
                                clientId={event.clientId?._id}
                                eventName={event.eventName}
                                clientName={event.clientId?.name}
                            />
                        )}
                        {activeTab === 'guests' && eventFeatures.guests && (
                            <GuestListTab eventId={event._id} event={event} />
                        )}

                        {activeTab === 'tasks' && eventFeatures.tasks && (
                            <EventTasksTab eventId={event._id} event={event} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetail;
