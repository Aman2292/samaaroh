import React, { useState, useEffect } from 'react';
import { Building, Gallery, Box, Calendar, Star1, Chart, MoneyRecive, Add, ArrowLeft, Location, TickCircle } from 'iconsax-react';
import VenueProfile from './VenueProfile';
import VenueGallery from './VenueGallery';
import VenuePackages from './VenuePackages';
import VenueAvailability from './VenueAvailability';
import CreateVenueModal from './CreateVenueModal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorMessage from '../../components/common/ErrorMessage';

const Venue = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [venues, setVenues] = useState([]);
    const [selectedVenue, setSelectedVenue] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        fetchVenues();
    }, []);

    const fetchVenues = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5001/api/venue', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await response.json();
            if (response.ok) {
                const newVenues = data.data || [];
                setVenues(newVenues);
                
                // Update selectedVenue if it exists to keep data fresh
                if (selectedVenue) {
                    const updatedSelected = newVenues.find(v => v._id === selectedVenue._id);
                    if (updatedSelected) {
                        setSelectedVenue(updatedSelected);
                    }
                }
            } else {
                setError(data.error || 'Failed to fetch venues');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSuccess = () => {
        fetchVenues();
        setIsCreateModalOpen(false);
    };

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon size="24" color="#FFFFFF" />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
            </div>
        </div>
    );

    const tabs = [
        { id: 'profile', label: 'Profile', icon: Building },
        { id: 'gallery', label: 'Gallery', icon: Gallery },
        { id: 'packages', label: 'Packages', icon: Box },
        { id: 'availability', label: 'Availability', icon: Calendar }
    ];

    if (loading && !venues.length) return <div className="p-8"><LoadingSkeleton type="card" count={3} /></div>;
    if (error) return <div className="p-8"><ErrorMessage message={error} onRetry={fetchVenues} /></div>;

    // DETAIL VIEW
    if (selectedVenue) {
        return (
            <div className="p-8 max-w-7xl mx-auto space-y-8">
                {/* Header with Back Button */}
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setSelectedVenue(null)}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size="24" color="#475569" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 capitalize">{selectedVenue.category} in {selectedVenue.address?.city}</h1>
                        <p className="text-slate-500 text-sm flex items-center mt-1">
                            <Location size="16" color="#64748b" className="mr-1" />
                            {selectedVenue.address?.street}, {selectedVenue.address?.city}
                        </p>
                    </div>
                </div>

                {/* Stats Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Total Bookings"
                        value={selectedVenue.availability?.filter(a => a.status === 'booked').length || 0}
                        icon={Chart}
                        color="bg-blue-500"
                    />
                    <StatCard
                        title="Revenue YTD"
                        value="₹0" // Placeholder
                        icon={MoneyRecive}
                        color="bg-green-500"
                    />
                    <StatCard
                        title="Avg Rating"
                        value="4.7⭐" // Placeholder
                        icon={Star1}
                        color="bg-yellow-500"
                    />
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="flex border-b border-slate-100 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${isActive
                                        ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    <Icon size="20" color={isActive ? "#4f46e5" : "#64748b"} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="p-6">
                        {activeTab === 'profile' && <VenueProfile venueData={selectedVenue} onUpdate={fetchVenues} />}
                        {activeTab === 'gallery' && <VenueGallery venueData={selectedVenue} onUpdate={fetchVenues} />}
                        {activeTab === 'packages' && <VenuePackages venueData={selectedVenue} onUpdate={fetchVenues} />}
                        {activeTab === 'availability' && <VenueAvailability venueData={selectedVenue} onUpdate={fetchVenues} />}
                    </div>
                </div>
            </div>
        );
    }

    // LIST VIEW
    return (
        <div className="p-8 max-w-7xl mx-auto h-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">My Venues</h1>
                    <p className="text-slate-500">Manage your properties and listings</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-md shadow-primary-200"
                >
                    <Add size="20" color="#FFFFFF" />
                    <span>Add Venue</span>
                </button>
            </div>

            {venues.length === 0 ? (
                // EMPTY STATE
                <div className="flex flex-col items-center justify-center h-[60vh] text-center bg-white rounded-2xl border border-dashed border-slate-300">
                    <div className="bg-primary-50 p-6 rounded-full mb-6">
                        <Building size="64" color="#4F46E5" variant="Bulk" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">No Venues Added Yet</h2>
                    <p className="text-slate-500 max-w-md mb-8">
                        Start by adding your first venue to manage bookings, packages, and availability.
                    </p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium shadow-lg shadow-primary-200"
                    >
                        <Add size="24" color="#FFFFFF" />
                        <span>Create Venue</span>
                    </button>
                </div>
            ) : (
                // VENUE LIST GRID
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {venues.map((venue) => (
                        <div
                            key={venue._id}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer group overflow-hidden"
                            onClick={() => setSelectedVenue(venue)}
                        >
                            {/* Card Image */}
                            <div className="h-48 bg-slate-100 relative">
                                {venue.galleryImages && venue.galleryImages.length > 0 ? (
                                    <img
                                        src={venue.galleryImages[0]}
                                        alt={venue.category}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <Gallery size="32" variant="Bulk" />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-slate-700 uppercase tracking-wide">
                                    {venue.category}
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="p-5">
                                <h3 className="text-lg font-bold text-slate-800 mb-1 capitalize group-hover:text-primary-600 transition-colors">
                                    {venue.category} in {venue.address?.city || 'Unknown City'}
                                </h3>
                                <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                                    {venue.description || 'No description provided.'}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div className="flex items-center text-slate-500 text-sm">
                                        <Location size="16" className="mr-1" />
                                        {venue.address?.city || 'N/A'}
                                    </div>
                                    <div className="flex items-center text-green-600 text-sm font-medium">
                                        <TickCircle size="16" className="mr-1" variant="Bold" />
                                        Active
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CreateVenueModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
            />
        </div>
    );
};

export default Venue;
