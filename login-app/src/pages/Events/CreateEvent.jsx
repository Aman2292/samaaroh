import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'iconsax-react';

const schema = yup.object().shape({
    clientId: yup.string().required('Client is required'),
    eventName: yup.string().required('Event name is required').min(2, 'Event name must be at least 2 characters'),
    eventType: yup.string().required('Event type is required'),
    eventDate: yup.date().required('Event date is required').min(new Date(), 'Event date cannot be in the past'),
    venue: yup.string(),
    estimatedBudget: yup.number().min(0, 'Budget must be positive'),
    leadPlannerId: yup.string().required('Lead planner is required'),
    notes: yup.string().max(1000, 'Notes must not exceed 1000 characters')
});

const CreateEvent = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [planners, setPlanners] = useState([]);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            leadPlannerId: userInfo._id,
            eventType: 'wedding'
        }
    });

    useEffect(() => {
        fetchClients();
        fetchPlanners();
    }, []);

    const fetchClients = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/clients?limit=100', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await response.json();
            if (response.ok) setClients(data.data);
        } catch (err) {
            console.error('Failed to fetch clients');
        }
    };

    const fetchPlanners = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/team', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await response.json();
            if (response.ok) {
                const plannerUsers = data.data.filter(u => ['PLANNER_OWNER', 'PLANNER'].includes(u.role));
                setPlanners(plannerUsers);
            }
        } catch (err) {
            console.error('Failed to fetch planners');
        }
    };

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5001/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                toast.success('Event created successfully');
                navigate('/events');
            } else {
                toast.error(result.error || 'Failed to create event');
            }
        } catch (err) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            <div className="max-w-3xl mx-auto">
                <button onClick={() => navigate('/events')} className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 mb-6">
                    <ArrowLeft size="20" color="currentColor" />
                    <span>Back to Events</span>
                </button>

                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
                    <h1 className="text-2xl font-bold text-slate-800 mb-6">Create New Event</h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Client <span className="text-red-500">*</span>
                                </label>
                                <select {...register('clientId')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    <option value="">Select client</option>
                                    {clients.map(client => (
                                        <option key={client._id} value={client._id}>{client.name}</option>
                                    ))}
                                </select>
                                {errors.clientId && <p className="mt-1 text-sm text-red-600">{errors.clientId.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Event Name <span className="text-red-500">*</span>
                                </label>
                                <input type="text" {...register('eventName')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Enter event name" />
                                {errors.eventName && <p className="mt-1 text-sm text-red-600">{errors.eventName.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Event Type <span className="text-red-500">*</span>
                                </label>
                                <select {...register('eventType')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    <option value="wedding">Wedding</option>
                                    <option value="birthday">Birthday</option>
                                    <option value="corporate">Corporate</option>
                                    <option value="anniversary">Anniversary</option>
                                    <option value="engagement">Engagement</option>
                                    <option value="other">Other</option>
                                </select>
                                {errors.eventType && <p className="mt-1 text-sm text-red-600">{errors.eventType.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Event Date <span className="text-red-500">*</span>
                                </label>
                                <input type="date" {...register('eventDate')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                {errors.eventDate && <p className="mt-1 text-sm text-red-600">{errors.eventDate.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Venue</label>
                                <input type="text" {...register('venue')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Enter venue" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Budget</label>
                                <input type="number" {...register('estimatedBudget')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="0" />
                                {errors.estimatedBudget && <p className="mt-1 text-sm text-red-600">{errors.estimatedBudget.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Lead Planner <span className="text-red-500">*</span>
                                </label>
                                <select {...register('leadPlannerId')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    {planners.map(planner => (
                                        <option key={planner._id} value={planner._id}>{planner.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                            <textarea {...register('notes')} rows="4" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" placeholder="Add any additional notes..." />
                            {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
                        </div>

                        <div className="flex space-x-3 pt-4">
                            <button type="button" onClick={() => navigate('/events')} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                                {loading ? 'Creating...' : 'Create Event'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateEvent;
