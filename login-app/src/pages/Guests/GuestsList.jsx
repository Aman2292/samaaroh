import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserAdd, DocumentDownload, DocumentUpload, Send, Trash, Filter, SearchNormal1, Refresh2, Scan, TickCircle, Clock } from 'iconsax-react';
import { toast } from 'react-toastify';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import AddGuestModal from '../../components/Guests/AddGuestModal';
import BulkImportModal from '../../components/Guests/BulkImportModal';
import GuestStatsCards from '../../components/Guests/GuestStatsCards';
import QRCodeModal from '../../components/Guests/QRCodeModal';

const GuestsList = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [guests, setGuests] = useState([]);
    const [stats, setStats] = useState({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState(null);
    const [selectedGuests, setSelectedGuests] = useState([]);
    const [checkInStats, setCheckInStats] = useState({});
    const [generatingQRs, setGeneratingQRs] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'tickets'
    const [event, setEvent] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        rsvpStatus: '',
        side: '',
        guestType: ''
    });

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        if (eventId) {
            fetchEventDetails();
            fetchGuests();
            fetchStats();
            fetchCheckInStats();

            // Poll for guests update every 10 seconds if in ticket mode
            let interval;
            if (viewMode === 'tickets') {
                interval = setInterval(fetchGuests, 10000);
            }
            return () => {
                if (interval) clearInterval(interval);
            };
        }
    }, [eventId, filters, viewMode]);

    const fetchEventDetails = async () => {
        try {
            const response = await fetch(
                `http://localhost:5001/api/events/${eventId}`,
                { headers: { 'Authorization': `Bearer ${userInfo.token}` } }
            );
            const data = await response.json();
            if (response.ok) {
                setEvent(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch event details:', error);
        }
    };

    const fetchGuests = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (filters.search) queryParams.append('search', filters.search);
            if (filters.rsvpStatus) queryParams.append('rsvpStatus', filters.rsvpStatus);
            if (filters.side) queryParams.append('side', filters.side);
            if (filters.guestType) queryParams.append('guestType', filters.guestType);

            const response = await fetch(
                `http://localhost:5001/api/guests/event/${eventId}?${queryParams}`,
                { headers: { 'Authorization': `Bearer ${userInfo.token}` } }
            );

            const data = await response.json();
            if (response.ok) {
                setGuests(data.data);
            } else {
                toast.error(data.error || 'Failed to fetch guests');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch(
                `http://localhost:5001/api/guests/event/${eventId}/stats`,
                { headers: { 'Authorization': `Bearer ${userInfo.token}` } }
            );

            const data = await response.json();
            if (response.ok) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchCheckInStats = async () => {
        try {
            const response = await fetch(
                `http://localhost:5001/api/guests/event/${eventId}/check-in-stats`,
                { headers: { 'Authorization': `Bearer ${userInfo.token}` } }
            );
            const data = await response.json();
            if (response.ok) {
                setCheckInStats(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch check-in stats:', error);
        }
    };

    const handleAddGuest = () => {
        setSelectedGuest(null);
        setShowAddModal(true);
    };

    // Generate QR codes for all guests
    const handleGenerateAllQRs = async () => {
        if (!window.confirm('Generate QR codes for all guests?')) return;

        setGeneratingQRs(true);
        try {
            const response = await fetch(
                `http://localhost:5001/api/guests/event/${eventId}/generate-all-qrs`,
                {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                }
            );

            const data = await response.json();
            if (response.ok) {
                toast.success(`Generated ${data.data.success} QR codes`);
                fetchGuests();
            } else {
                toast.error(data.error || 'Failed to generate QR codes');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setGeneratingQRs(false);
        }
    };

    // Show QR code for a guest
    const handleShowQR = (guest) => {
        setSelectedGuest(guest);
        setShowQRModal(true);
    };

    const handleEditGuest = (guest) => {
        setSelectedGuest(guest);
        setShowAddModal(true);
    };

    const handleDeleteGuest = async (guestId) => {
        if (!window.confirm('Are you sure you want to delete this guest?')) return;

        try {
            const response = await fetch(`http://localhost:5001/api/guests/${guestId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            if (response.ok) {
                toast.success('Guest deleted successfully');
                fetchGuests();
                fetchStats();
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to delete guest');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedGuests.length === 0) {
            toast.warning('Please select guests to delete');
            return;
        }

        if (!window.confirm(`Delete ${selectedGuests.length} selected guests?`)) return;

        try {
            const response = await fetch('http://localhost:5001/api/guests/bulk-delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ guestIds: selectedGuests })
            });

            if (response.ok) {
                toast.success('Guests deleted successfully');
                setSelectedGuests([]);
                fetchGuests();
                fetchStats();
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to delete guests');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        }
    };

    const handleExport = async () => {
        try {
            const response = await fetch(
                `http://localhost:5001/api/guests/event/${eventId}/export`,
                { headers: { 'Authorization': `Bearer ${userInfo.token}` } }
            );

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `guests-${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                toast.success('Guests exported successfully');
            } else {
                toast.error('Failed to export guests');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        }
    };

    const toggleSelectGuest = (guestId) => {
        setSelectedGuests(prev =>
            prev.includes(guestId)
                ? prev.filter(id => id !== guestId)
                : [...prev, guestId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedGuests.length === guests.length) {
            setSelectedGuests([]);
        } else {
            setSelectedGuests(guests.map(g => g._id));
        }
    };

    const getRSVPBadge = (status) => {
        const badges = {
            pending: 'bg-gray-100 text-gray-700',
            attending: 'bg-green-100 text-green-700',
            not_attending: 'bg-red-100 text-red-700',
            maybe: 'bg-yellow-100 text-yellow-700'
        };
        const labels = {
            pending: 'Pending',
            attending: 'Attending',
            not_attending: 'Not Attending',
            maybe: 'Maybe'
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status] || badges.pending}`}>
                {labels[status] || status}
            </span>
        );
    };

    // Check if event is today
    const isEventToday = () => {
        if (!event || !event.eventDate) return false;
        const today = new Date();
        const eventDate = new Date(event.eventDate);
        return today.toDateString() === eventDate.toDateString();
    };

    const TicketCard = ({ guest }) => (
        <div className={`relative bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-300 ${guest.checkedIn ? 'opacity-70 scale-95 grayscale' : 'hover:shadow-md'
            }`}>
            {/* Blurring overlay for checked in */}
            {guest.checkedIn && (
                <div className="absolute inset-0 z-20 backdrop-blur-[2px] bg-white/30 flex flex-col items-center justify-center border-4 border-green-500 rounded-xl">
                    <div className="bg-green-500 text-white p-3 rounded-full shadow-lg mb-2">
                        <TickCircle size="32" variant="Bold" />
                    </div>
                    <span className="text-green-700 font-bold text-lg bg-white/80 px-4 py-1 rounded-full">
                        Checked In
                    </span>
                    <span className="text-gray-700 text-sm mt-1 bg-white/80 px-3 py-0.5 rounded-full">
                        {new Date(guest.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            )}

            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg truncate" title={`${guest.firstName} ${guest.lastName}`}>
                            {guest.firstName} {guest.lastName}
                        </h3>
                        <div className="text-sm text-gray-500 capitalize">{guest.side} side • {guest.guestType}</div>
                    </div>
                </div>

                <div className="flex flex-col items-center py-2">
                    {guest.qrCodeImage ? (
                        <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm cursor-pointer" onClick={() => handleShowQR(guest)}>
                            <img src={guest.qrCodeImage} alt="QR" className="w-32 h-32 object-contain" />
                            <p className="text-[10px] text-center text-gray-400 mt-1 font-mono tracking-wider">
                                {guest.qrCode}
                            </p>
                        </div>
                    ) : (
                        <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs text-center p-2">
                            QR Not Generated
                        </div>
                    )}
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500">Exp: {guest.expectedHeadcount}</span>
                        {guest.checkedIn && (
                            <span className="text-green-600 font-medium">• Act: {guest.actualHeadcount}</span>
                        )}
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => handleShowQR(guest)}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                            View Details
                        </button>
                    </div>
                </div>
            </div>

            {/* Status Strip */}
            <div className={`h-2 w-full ${guest.checkedIn ? 'bg-green-500' : 'bg-gray-200'}`} />
        </div>
    );

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {event ? event.eventName : 'Guest List'}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {viewMode === 'tickets' ? 'Live Check-in View' : 'Manage your event guests and RSVPs'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {/* View Toggles */}
                        <div className="bg-white p-1 rounded-lg border border-gray-300 flex">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                List
                            </button>
                            <button
                                onClick={() => setViewMode('tickets')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'tickets' ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Live Tickets
                            </button>
                        </div>

                        {/* Scanner Button - Highlighted if Event is Today */}
                        <button
                            onClick={() => navigate(`/events/${eventId}/check-in`)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white shadow-sm transition-all ${isEventToday()
                                    ? 'bg-green-600 hover:bg-green-700 ring-2 ring-green-500 ring-offset-1 animate-pulse'
                                    : 'bg-gray-700 hover:bg-gray-800'
                                }`}
                        >
                            <Scan size="20" />
                            {isEventToday() ? 'Start Check-in' : 'Open Scanner'}
                        </button>

                        {viewMode === 'list' && (
                            <>
                                <button
                                    onClick={handleGenerateAllQRs}
                                    disabled={generatingQRs}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {generatingQRs ? 'Generating...' : 'Generate QRs'}
                                </button>
                                <button
                                    onClick={handleExport}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    <DocumentDownload size="20" />
                                    Export
                                </button>
                                <button
                                    onClick={() => setShowImportModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    <DocumentUpload size="20" />
                                    Import
                                </button>
                                <button
                                    onClick={handleAddGuest}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                >
                                    <UserAdd size="20" />
                                    Add Guest
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <GuestStatsCards stats={stats} />

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <SearchNormal1 size="18" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search guests..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={filters.rsvpStatus}
                            onChange={(e) => setFilters({ ...filters, rsvpStatus: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">All RSVP Status</option>
                            <option value="pending">Pending</option>
                            <option value="attending">Attending</option>
                            <option value="not_attending">Not Attending</option>
                            <option value="maybe">Maybe</option>
                        </select>
                        <select
                            value={filters.side}
                            onChange={(e) => setFilters({ ...filters, side: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">All Sides</option>
                            <option value="bride">Bride</option>
                            <option value="groom">Groom</option>
                            <option value="both">Both</option>
                            <option value="neutral">Neutral</option>
                        </select>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilters({ search: '', rsvpStatus: '', side: '', guestType: '' })}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Clear
                            </button>
                            <button
                                onClick={fetchGuests}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                            >
                                <Refresh2 size="20" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bulk Actions (Only in List Mode) */}
                {viewMode === 'list' && selectedGuests.length > 0 && (
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                        <p className="text-primary-700 font-medium">
                            {selectedGuests.length} guest(s) selected
                        </p>
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            <Trash size="18" />
                            Delete Selected
                        </button>
                    </div>
                )}

                {/* Content Area */}
                <div className="min-h-[400px]">
                    {loading && guests.length === 0 ? (
                        <div className="p-6">
                            <LoadingSkeleton type="table" count={5} />
                        </div>
                    ) : guests.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                            <UserAdd size="48" className="mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Guests Yet</h3>
                            <p className="text-gray-500 mb-4">Start by adding your first guest or importing from Excel</p>
                            <button
                                onClick={handleAddGuest}
                                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                            >
                                Add First Guest
                            </button>
                        </div>
                    ) : viewMode === 'tickets' ? (
                        /* TICKET VIEW */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {guests.map((guest) => (
                                <TicketCard key={guest._id} guest={guest} />
                            ))}
                        </div>
                    ) : (
                        /* LIST VIEW */
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectedGuests.length === guests.length}
                                                onChange={toggleSelectAll}
                                                className="rounded"
                                            />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Contact</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Type/Side</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">RSVP</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Check-In</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {guests.map((guest) => (
                                        <tr key={guest._id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedGuests.includes(guest._id)}
                                                    onChange={() => toggleSelectGuest(guest._id)}
                                                    className="rounded"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{guest.firstName} {guest.lastName}</div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                <div>{guest.email || '-'}</div>
                                                <div className="text-xs text-gray-500">{guest.phone || '-'}</div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="text-gray-700 capitalize">{guest.guestType}</div>
                                                <div className="text-xs text-gray-500 capitalize">{guest.side}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {getRSVPBadge(guest.rsvpStatus)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {guest.checkedIn ? (
                                                    <span className="flex items-center gap-1 text-green-600">
                                                        <TickCircle size="16" variant="Bold" />
                                                        <span className="text-xs">Checked In</span>
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-gray-400">
                                                        <Clock size="16" />
                                                        <span className="text-xs">Pending</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {guest.qrCode && (
                                                        <button
                                                            onClick={() => handleShowQR(guest)}
                                                            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                                                        >
                                                            QR
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleEditGuest(guest)}
                                                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteGuest(guest._id)}
                                                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showAddModal && (
                <AddGuestModal
                    eventId={eventId}
                    guest={selectedGuest}
                    onClose={() => {
                        setShowAddModal(false);
                        setSelectedGuest(null);
                    }}
                    onSuccess={() => {
                        fetchGuests();
                        fetchStats();
                    }}
                />
            )}

            {showImportModal && (
                <BulkImportModal
                    eventId={eventId}
                    onClose={() => setShowImportModal(false)}
                    onSuccess={() => {
                        fetchGuests();
                        fetchStats();
                    }}
                />
            )}

            {showQRModal && selectedGuest && (
                <QRCodeModal
                    guest={selectedGuest}
                    onClose={() => {
                        setShowQRModal(false);
                        setSelectedGuest(null);
                    }}
                />
            )}
        </div>
    );
};

export default GuestsList;
