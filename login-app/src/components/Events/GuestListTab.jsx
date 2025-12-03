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
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

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

            const response = await fetch(`http://localhost:5001/api/events/${eventId}/guests?${params}`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setGuests(data.guests || []);
            }
        } catch (error) {
            toast.error('Failed to fetch guests');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/events/${eventId}/guests/stats`, {
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

        if (percentage >= 100) {
            return (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
                    <Danger size="24" color="#ef4444" variant="Bold" className="shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-red-800 font-semibold">Capacity Limit Exceeded!</h4>
                        <p className="text-red-600 text-sm mt-1">
                            Current headcount ({headcount}) exceeds the venue capacity ({event.capacity}).
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

            const response = await fetch(`http://localhost:5001/api/events/${eventId}/guests/export?${params}`, {
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
            const response = await fetch(`http://localhost:5001/api/events/${eventId}/guests/${guestToDelete._id}`, {
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
            const response = await fetch(`http://localhost:5001/api/events/${eventId}/guests/${guestId}/check-in`, {
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

    return (
        <div className="space-y-6">
            {/* Capacity Alert */}
            {renderCapacityAlert()}

            {/* Summary Cards */}
            <GuestSummaryCards stats={stats} />

            {/* Actions and Filters */}
            <GuestFilters
                filters={filters}
                setFilters={setFilters}
                onAddGuest={() => setShowAddModal(true)}
                onQuickAdd={handleQuickAdd}
                onImport={() => setShowImportModal(true)}
                onExport={handleExport}
            />

            {/* Guest Table */}
            <GuestTable
                guests={guests}
                loading={loading}
                onEdit={handleEditGuest}
                onDelete={handleDeleteClick}
                onCheckIn={handleCheckIn}
            />

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
