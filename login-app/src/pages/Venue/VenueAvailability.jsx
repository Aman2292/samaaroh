import React, { useState, useEffect } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
    isBefore,
    startOfDay
} from 'date-fns';
import { Calendar, ArrowLeft2, ArrowRight2, Lock, Unlock, TickCircle, CloseCircle, CloudChange } from 'iconsax-react';
import { toast } from 'react-toastify';

const VenueAvailability = ({ venueData, onUpdate }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [availabilityMap, setAvailabilityMap] = useState({});
    const [isDirty, setIsDirty] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);

    // Bulk Modal State
    const [bulkStartDate, setBulkStartDate] = useState('');
    const [bulkEndDate, setBulkEndDate] = useState('');
    const [bulkStatus, setBulkStatus] = useState('blocked');
    const [bulkNotes, setBulkNotes] = useState('');

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        if (venueData && venueData.availability) {
            const map = {};
            venueData.availability.forEach(item => {
                const dateKey = format(new Date(item.date), 'yyyy-MM-dd');
                map[dateKey] = item;
            });
            setAvailabilityMap(map);
            setIsDirty(false);
        }
    }, [venueData]);

    const resetChanges = () => {
        if (venueData && venueData.availability) {
            const map = {};
            venueData.availability.forEach(item => {
                const dateKey = format(new Date(item.date), 'yyyy-MM-dd');
                map[dateKey] = item;
            });
            setAvailabilityMap(map);
            setIsDirty(false);
        }
    };

    const handleDateClick = (day) => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const currentStatus = availabilityMap[dateKey]?.status || 'available';

        // Cycle: available -> blocked -> available
        // Booked dates are immutable via this view (managed via bookings)
        if (currentStatus === 'booked') {
            toast.info('This date is booked and cannot be changed here.');
            return;
        }

        const newStatus = currentStatus === 'available' ? 'blocked' : 'available';

        setAvailabilityMap(prev => ({
            ...prev,
            [dateKey]: {
                date: day,
                status: newStatus,
                notes: newStatus === 'blocked' ? 'Blocked by owner' : ''
            }
        }));
        setIsDirty(true);
    };

    const handleBulkSubmit = (e) => {
        e.preventDefault();
        if (!bulkStartDate || !bulkEndDate) {
            toast.error('Please select both start and end dates');
            return;
        }

        let start = new Date(bulkStartDate);
        const end = new Date(bulkEndDate);

        if (isBefore(end, start)) {
            toast.error('End date cannot be before start date');
            return;
        }

        const newMap = { ...availabilityMap };
        let current = start;

        while (isBefore(current, end) || isSameDay(current, end)) {
            const dateKey = format(current, 'yyyy-MM-dd');
            // Skip booked dates
            if (newMap[dateKey]?.status !== 'booked') {
                newMap[dateKey] = {
                    date: new Date(current),
                    status: bulkStatus,
                    notes: bulkNotes
                };
            }
            current = addDays(current, 1);
        }

        setAvailabilityMap(newMap);
        setIsDirty(true);
        setShowBulkModal(false);
        setBulkStartDate('');
        setBulkEndDate('');
        setBulkNotes('');
        toast.success('Dates updated locally. Remember to save changes.');
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Convert map to array for API
            const updates = Object.values(availabilityMap).map(item => ({
                date: item.date,
                status: item.status,
                notes: item.notes
            }));

            const response = await fetch(`https://samaaroh-1.onrender.com/api/venue/${venueData._id}/availability`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify(updates)
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Availability updated successfully');
                setIsDirty(false);
                onUpdate();
            } else {
                toast.error(data.error || 'Failed to update availability');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    // Calendar Render Logic
    const renderHeader = () => {
        return (
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Calendar size="24" color="#4f46e5" />
                    {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <div className="flex space-x-2">
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft2 size="20" color="#64748b" />
                    </button>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 rounded-full">
                        <ArrowRight2 size="20" color="#64748b" />
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = [];
        const dateFormat = "EEE";
        const startDate = startOfWeek(currentMonth);

        for (let i = 0; i < 7; i++) {
            days.push(
                <div key={i} className="text-center text-sm font-semibold text-slate-500 py-2">
                    {format(addDays(startDate, i), dateFormat)}
                </div>
            );
        }
        return <div className="grid grid-cols-7 mb-2">{days}</div>;
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, "d");
                const cloneDay = day;
                const dateKey = format(day, 'yyyy-MM-dd');
                const status = availabilityMap[dateKey]?.status || 'available';
                const isBooked = status === 'booked';
                const isBlocked = status === 'blocked';
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isToday = isSameDay(day, new Date());

                days.push(
                    <div
                        key={day}
                        onClick={() => handleDateClick(cloneDay)}
                        className={`
                            h-24 border border-slate-100 p-2 relative cursor-pointer transition-colors
                            ${!isCurrentMonth ? 'bg-slate-50 text-slate-400' : 'bg-white'}
                            ${isBlocked ? 'bg-red-50 hover:bg-red-100' : ''}
                            ${isBooked ? 'bg-primary-50 cursor-not-allowed' : 'hover:bg-slate-50'}
                            ${isToday ? 'ring-2 ring-primary-500 ring-inset' : ''}
                        `}
                    >
                        <span className={`text-sm font-medium ${!isCurrentMonth ? 'text-slate-400' : 'text-slate-700'}`}>
                            {formattedDate}
                        </span>

                        {isBlocked && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500">
                                <Lock size="20" variant="Bold" />
                                <span className="text-xs font-medium mt-1">Blocked</span>
                            </div>
                        )}

                        {isBooked && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-primary-600">
                                <TickCircle size="20" variant="Bold" />
                                <span className="text-xs font-medium mt-1">Booked</span>
                            </div>
                        )}
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div key={day} className="grid grid-cols-7">
                    {days}
                </div>
            );
            days = [];
        }
        return <div>{rows}</div>;
    };

    // Calculate Stats
    const calculateStats = () => {
        const today = startOfDay(new Date());
        const next30Days = addDays(today, 30);
        let availableCount = 0;
        let totalCount = 0;

        let current = today;
        while (current <= next30Days) {
            const dateKey = format(current, 'yyyy-MM-dd');
            const status = availabilityMap[dateKey]?.status || 'available';
            if (status === 'available') availableCount++;
            totalCount++;
            current = addDays(current, 1);
        }

        return Math.round((availableCount / totalCount) * 100);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                        <span className="text-sm text-slate-500">Next 30 Days Availability</span>
                        <p className="text-2xl font-bold text-primary-600">{calculateStats()}%</p>
                    </div>
                    <div className="flex gap-2 text-sm">
                        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-white border border-slate-300"></span> Available</div>
                        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-100 border border-red-200"></span> Blocked</div>
                        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary-100 border border-primary-200"></span> Booked</div>
                    </div>
                </div>

                <button
                    onClick={() => setShowBulkModal(true)}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium flex items-center gap-2"
                >
                    <Lock size="18" />
                    Block Date Range
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                {renderHeader()}
                {renderDays()}
                {renderCells()}
            </div>

            {/* Action Buttons */}
            {isDirty && (
                <div className="flex justify-end space-x-4 pt-4 animate-fadeIn sticky bottom-4">
                    <div className="bg-white p-2 rounded-xl shadow-lg border border-slate-100 flex gap-4">
                        <button
                            onClick={resetChanges}
                            className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                        >
                            Discard Changes
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center space-x-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 shadow-lg shadow-primary-200"
                        >
                            {loading ? <CloudChange size="20" color="#FFFFFF" className="animate-bounce" /> : <TickCircle size="20" color="#FFFFFF" />}
                            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Bulk Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800">Block Date Range</h3>
                            <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600">
                                <CloseCircle size="24" />
                            </button>
                        </div>
                        <form onSubmit={handleBulkSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={bulkStartDate}
                                    onChange={(e) => setBulkStartDate(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={bulkEndDate}
                                    onChange={(e) => setBulkEndDate(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    value={bulkStatus}
                                    onChange={(e) => setBulkStatus(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="blocked">Blocked</option>
                                    <option value="available">Available</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                                <textarea
                                    value={bulkNotes}
                                    onChange={(e) => setBulkNotes(e.target.value)}
                                    placeholder="Reason for blocking..."
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500"
                                    rows="2"
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                                >
                                    Apply Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VenueAvailability;
