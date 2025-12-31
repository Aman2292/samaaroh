import React, { useState, useEffect } from 'react';
import { Add, User, People, TickCircle, DocumentDownload, DocumentUpload, SearchNormal, Danger } from 'iconsax-react';
import { toast } from 'react-toastify';
import AddGuestModal from './AddGuestModal';
import EditGuestModal from './EditGuestModal';
import QuickAddGuestModal from './QuickAddGuestModal';
import ImportGuestsModal from './ImportGuestsModal';
import GuestSummaryCards from './GuestSummaryCards';
import GuestFilters from './GuestFilters';
import GuestTable from './GuestTable';
import DeleteConfirmationModal from '../common/DeleteConfirmationModal';
import { useNavigate } from 'react-router-dom';
import { Scan } from 'iconsax-react';
import QRCodeModal from '../../components/Guests/QRCodeModal';

const GuestListTab = ({ eventId, event }) => {
    const [guests, setGuests] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ side: '', group: '', rsvpStatus: '', source: '', search: '' });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState(null);
    const [showQuickAddModal, setShowQuickAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [guestToDelete, setGuestToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [viewMode, setViewMode] = useState('list'); // 'list' or 'tickets'
    const [showQRModal, setShowQRModal] = useState(false);
    const [generatingQRs, setGeneratingQRs] = useState(false);

    const navigate = useNavigate();
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    // Poll for guests update every 10 seconds if in ticket mode
    useEffect(() => {
        let interval;
        if (viewMode === 'tickets') {
            interval = setInterval(() => {
                fetchGuests();
                fetchStats();
            }, 10000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [viewMode, eventId]);

    useEffect(() => {
        fetchGuests();
        fetchStats();
    }, [eventId, filters]);

    const fetchGuests = async () => {
        try {
            const params = new URLSearchParams({
                ...(filters.side && { side: filters.side }),
                ...(filters.group && { group: filters.group }),
                ...(filters.rsvpStatus && { rsvpStatus: filters.rsvpStatus }),
                ...(filters.source && { source: filters.source }),
                ...(filters.search && { search: filters.search })
            });

            const response = await fetch(`https://samaaroh-1.onrender.com/api/guests/event/${eventId}?${params}`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setGuests(data.data || []);
            }
        } catch (error) {
            toast.error('Failed to fetch guests');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch(`https://samaaroh-1.onrender.com/api/guests/event/${eventId}/stats`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setStats(data.data || {});
            }
        } catch (error) {
            console.error('Failed to fetch stats');
        }
    };

    const renderCapacityAlert = () => {
        if (!event?.capacity || event.capacity === 0) return null;

        const headcount = stats.expectedHeadcount || 0;
        const percentage = (headcount / event.capacity) * 100;
        const overage = headcount - event.capacity;

        if (headcount > event.capacity) {
            const overagePercent = Math.round(((headcount - event.capacity) / event.capacity) * 100);

            return (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3 animate-pulse">
                    <Danger size="24" color="#ef4444" variant="Bold" className="shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-red-800 font-bold">⚠️ Capacity Limit Exceeded!</h4>
                        <p className="text-red-700 text-sm mt-1 font-medium">
                            You are <strong>{overage} guests</strong> above planned capacity ({overagePercent}%).
                        </p>
                        <p className="text-red-600 text-xs mt-1">
                            Talk to your venue or caterer immediately to avoid issues.
                        </p>
                    </div>
                </div>
            );
        }

        if (percentage >= 90) {
            return (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start space-x-3">
                    <Danger size="24" color="#f97316" variant="Bold" className="shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-orange-800 font-semibold">Approaching Capacity Limit</h4>
                        <p className="text-orange-600 text-sm mt-1">
                            You have reached {Math.round(percentage)}% of your venue capacity ({headcount}/{event.capacity}).
                        </p>
                    </div>
                </div>
            );
        }

        return null;
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams({
                ...(filters.side && { side: filters.side }),
                ...(filters.group && { group: filters.group }),
                ...(filters.rsvpStatus && { rsvpStatus: filters.rsvpStatus })
            });

            const response = await fetch(`https://samaaroh-1.onrender.com/api/guests/event/${eventId}/export?${params}`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `guests-${eventId}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success('Guests exported successfully');
            } else {
                toast.error('Failed to export guests');
            }
        } catch (error) {
            toast.error('Failed to export guests');
        }
    };

    const handleDeleteClick = (guest) => {
        setGuestToDelete(guest);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!guestToDelete) return;

        try {
            setDeleteLoading(true);
            const response = await fetch(`https://samaaroh-1.onrender.com/api/guests/${guestToDelete._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                }
            });

            if (response.ok) {
                toast.success('Guest deleted successfully');
                fetchGuests();
                fetchStats();
                setShowDeleteModal(false);
                setGuestToDelete(null);
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to delete guest');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleEditGuest = (guest) => {
        setSelectedGuest(guest);
        setShowEditModal(true);
    };

    const isEventToday = () => {
        if (!event?.eventDate) return false;
        const today = new Date();
        const eventDate = new Date(event.eventDate);
        return (
            today.getDate() === eventDate.getDate() &&
            today.getMonth() === eventDate.getMonth() &&
            today.getFullYear() === eventDate.getFullYear()
        );
    };

    const handleQuickAdd = () => {
        if (!isEventToday()) {
            toast.error('Quick Add is only available on the day of the event.');
            return;
        }
        setShowQuickAddModal(true);
    };

    const handleCheckIn = async (guestId) => {
        if (!isEventToday()) {
            toast.error('Check-in is only available on the day of the event.');
            return;
        }

        try {
            const response = await fetch(`https://samaaroh-1.onrender.com/api/events/${eventId}/guests/${guestId}/check-in`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Guest checked in successfully');
                fetchGuests();
                fetchStats();
            } else {
                toast.error(data.error || 'Failed to check in guest');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        }
    };

    const handleGenerateAllQRs = async () => {
        if (!window.confirm('Generate QR codes for all guests? This may take a moment.')) return;

        setGeneratingQRs(true);
        try {
            const response = await fetch(
                `https://samaaroh-1.onrender.com/api/guests/event/${eventId}/generate-all-qrs`,
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

    const handleShowQR = (guest) => {
        setSelectedGuest(guest);
        setShowQRModal(true);
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
        <div className="space-y-6">
            {/* Capacity Alert */}
            {renderCapacityAlert()}

            {/* Summary Cards */}
            <GuestSummaryCards stats={stats} />

            {/* Actions and Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-2">
                    <div className="bg-white p-1 rounded-lg border border-slate-200 flex">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            List
                        </button>
                        <button
                            onClick={() => setViewMode('tickets')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'tickets' ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Live Tickets
                        </button>
                    </div>

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
                        <button
                            onClick={handleGenerateAllQRs}
                            disabled={generatingQRs}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                            {generatingQRs ? 'Gen QRs' : 'Generate'}
                        </button>
                    )}
                </div>

                <div className="flex-1">
                    <GuestFilters
                        filters={filters}
                        setFilters={setFilters}
                        onAddGuest={() => setShowAddModal(true)}
                        onQuickAdd={handleQuickAdd}
                        onImport={() => setShowImportModal(true)}
                        onExport={handleExport}
                    />
                </div>
            </div>

            {/* Guest Table or Ticket Grid */}
            {viewMode === 'tickets' ? (
                /* TICKET VIEW */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {guests.map((guest) => (
                        <TicketCard key={guest._id} guest={guest} />
                    ))}
                    {guests.length === 0 && !loading && (
                        <div className="col-span-full text-center py-12 text-slate-500">
                            No guests found. Switch to list view to add guests.
                        </div>
                    )}
                </div>
            ) : (
                /* LIST VIEW */
                <GuestTable
                    guests={guests}
                    loading={loading}
                    onEdit={handleEditGuest}
                    onDelete={handleDeleteClick}
                    onCheckIn={handleCheckIn}
                />
            )}

            {/* QR display modal */}
            {showQRModal && selectedGuest && (
                <QRCodeModal
                    guest={selectedGuest}
                    onClose={() => {
                        setShowQRModal(false);
                        setSelectedGuest(null);
                    }}
                />
            )}

            {/* Add Guest Modal */}
            <AddGuestModal
                eventId={eventId}
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    fetchGuests();
                    fetchStats();
                }}
            />

            {/* Edit Guest Modal */}
            <EditGuestModal
                eventId={eventId}
                guest={selectedGuest}
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedGuest(null);
                }}
                onSuccess={() => {
                    fetchGuests();
                    fetchStats();
                }}
            />

            {/* Quick Add Guest Modal */}
            <QuickAddGuestModal
                eventId={eventId}
                isOpen={showQuickAddModal}
                onClose={() => setShowQuickAddModal(false)}
                onSuccess={() => {
                    fetchGuests();
                    fetchStats();
                }}
            />

            {/* Import CSV Modal */}
            <ImportGuestsModal
                eventId={eventId}
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onSuccess={() => {
                    fetchGuests();
                    fetchStats();
                }}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setGuestToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Guest"
                message={`Are you sure you want to delete ${guestToDelete?.name}? This action cannot be undone.`}
                loading={deleteLoading}
            />
        </div>
    );
};

export default GuestListTab;
