import React, { useState, useEffect } from 'react';
import { Building, Gallery, Box, Calendar, Star1, Chart, MoneyRecive, Add, ArrowLeft, Location, TickCircle, Edit2, More } from 'iconsax-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import VenueProfile from './VenueProfile';
import VenueGallery from './VenueGallery';
import VenuePackages from './VenuePackages';
import VenueAvailability from './VenueAvailability';
import VenueTasks from './VenueTasks';
import CreateVenueModal from './CreateVenueModal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorMessage from '../../components/common/ErrorMessage';

const Venue = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [venues, setVenues] = useState([]);
    const [selectedVenue, setSelectedVenue] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const navigate = useNavigate();
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        fetchVenues();
    }, []);

    const fetchVenues = async () => {
        try {
            setLoading(true);
            const response = await fetch('https://samaaroh-1.onrender.com/api/venue', {
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
                setError(data.error || t('venue.fetchError') || 'Failed to fetch venues');
            }
        } catch (err) {
            setError(t('venue.serverError') || 'Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSuccess = () => {
        fetchVenues();
        setIsCreateModalOpen(false);
    };

    const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
        <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-200 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${bgColor}`}>
                    <Icon size="24" color={color} variant="Bold" />
                </div>
            </div>
        </div>
    );

    const orgFeatures = userInfo.organizationId?.subscribedFeatures || {};
    const venueFeatures = typeof orgFeatures.venue === 'object'
        ? orgFeatures.venue
        : { access: !!orgFeatures.venue, profile: true, gallery: true, packages: true, availability: true, tasks: true };

    const tabs = [
        { id: 'profile', label: t('venue.profile'), icon: Building, show: venueFeatures.profile !== false, description: t('venue.profileDesc') },
        { id: 'gallery', label: t('venue.gallery'), icon: Gallery, show: venueFeatures.gallery !== false, description: t('venue.galleryDesc') },
        { id: 'packages', label: t('venue.packages'), icon: Box, show: venueFeatures.packages !== false, description: t('venue.packagesDesc') },
        { id: 'availability', label: t('venue.availability'), icon: Calendar, show: venueFeatures.availability !== false, description: t('venue.availabilityDesc') },
        { id: 'tasks', label: t('venue.tasks'), icon: TickCircle, show: venueFeatures.tasks !== false, description: t('venue.tasksDesc') }
    ].filter(tab => tab.show);

    if (loading && !venues.length) return <div className="p-8"><LoadingSkeleton type="card" count={3} /></div>;
    if (error) return <div className="p-8"><ErrorMessage message={error} onRetry={fetchVenues} /></div>;

    // DETAIL VIEW
    if (selectedVenue) {
        return (
            <div className="min-h-screen bg-slate-50">
                {/* Breadcrumbs & Header */}
                <div className="bg-white border-b border-slate-200">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        {/* Breadcrumbs */}
                        <div className="flex items-center text-sm text-slate-500 mb-4">
                            <button
                                onClick={() => setSelectedVenue(null)}
                                className="hover:text-blue-600 transition-colors"
                            >
                                {t('venue.title')}
                            </button>
                            <span className="mx-2">/</span>
                            <span className="text-slate-800 font-medium">{selectedVenue.category} in {selectedVenue.address?.city}</span>
                        </div>

                        {/* Header with Actions */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSelectedVenue(null)}
                                    className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    <ArrowLeft size="20" color="#475569" />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-800 capitalize flex items-center gap-2">
                                        {selectedVenue.category} in {selectedVenue.address?.city}
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700">
                                            <TickCircle size="14" className="mr-1" variant="Bold" />
                                            {t('common.active')}
                                        </span>
                                    </h1>
                                    <p className="text-slate-500 text-sm flex items-center mt-1">
                                        <Location size="16" color="#64748b" className="mr-1" />
                                        {selectedVenue.address?.street}, {selectedVenue.address?.city}
                                    </p>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex items-center gap-2">
                                <button className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2">
                                    <Edit2 size="18" />
                                    {t('venue.editDetails')}
                                </button>
                                <button className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                                    <More size="20" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
                    {/* Stats Banner */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard
                            title={t('venue.totalBookings')}
                            value={selectedVenue.availability?.filter(a => a.status === 'booked').length || 0}
                            icon={Chart}
                            color="#3B82F6"
                            bgColor="bg-blue-50"
                        />
                        <StatCard
                            title={t('venue.revenueYTD')}
                            value="₹0"
                            icon={MoneyRecive}
                            color="#10B981"
                            bgColor="bg-green-50"
                        />
                        <StatCard
                            title={t('venue.avgRating')}
                            value="4.7⭐"
                            icon={Star1}
                            color="#F59E0B"
                            bgColor="bg-yellow-50"
                        />
                    </div>

                    {/* Modern Tabs */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        {/* Tab Navigation */}
                        <div className="border-b border-slate-200 bg-slate-50/50">
                            <div className="flex overflow-x-auto scrollbar-hide">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`group relative flex items-center gap-2.5 px-6 py-4 font-medium transition-all whitespace-nowrap ${isActive
                                                ? 'text-blue-600'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                                                }`}
                                        >
                                            <Icon
                                                size="20"
                                                color={isActive ? "#2563EB" : "#64748b"}
                                                variant={isActive ? "Bold" : "Linear"}
                                            />
                                            <div className="text-left">
                                                <div className="text-sm font-semibold">{tab.label}</div>
                                                {isActive && (
                                                    <div className="text-xs text-slate-500 font-normal">{tab.description}</div>
                                                )}
                                            </div>
                                            {isActive && (
                                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {activeTab === 'profile' && <VenueProfile venueData={selectedVenue} onUpdate={fetchVenues} />}
                            {activeTab === 'gallery' && <VenueGallery venueData={selectedVenue} onUpdate={fetchVenues} />}
                            {activeTab === 'packages' && <VenuePackages venueData={selectedVenue} onUpdate={fetchVenues} />}
                            {activeTab === 'availability' && <VenueAvailability venueData={selectedVenue} onUpdate={fetchVenues} />}
                            {activeTab === 'tasks' && <VenueTasks venueData={selectedVenue} onUpdate={fetchVenues} />}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // LIST VIEW
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">{t('venue.title')}</h1>
                        <p className="text-slate-500 mt-1">{t('venue.manage')}</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg shadow-blue-200 hover:shadow-xl"
                    >
                        <Add size="20" color="#FFFFFF" variant="Bold" />
                        <span>{t('venue.addVenue')}</span>
                    </button>
                </div>

                {venues.length === 0 ? (
                    // EMPTY STATE
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-2xl border-2 border-dashed border-slate-300">
                        <div className="bg-blue-50 p-8 rounded-full mb-6">
                            <Building size="64" color="#3B82F6" variant="Bulk" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('venue.noVenues')}</h2>
                        <p className="text-slate-500 max-w-md mb-8">
                            {t('venue.getStarted')}
                        </p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg shadow-blue-200"
                        >
                            <Add size="24" color="#FFFFFF" variant="Bold" />
                            <span>{t('venue.createFirst')}</span>
                        </button>
                    </div>
                ) : (
                    // VENUE GRID
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {venues.map((venue) => (
                            <div
                                key={venue._id}
                                className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
                                onClick={() => setSelectedVenue(venue)}
                            >
                                {/* Image */}
                                <div className="h-52 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                                    {venue.galleryImages && venue.galleryImages.length > 0 ? (
                                        <img
                                            src={venue.galleryImages[0]}
                                            alt={venue.category}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Gallery size="48" variant="Bulk" color="#CBD5E1" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 uppercase tracking-wider shadow-lg">
                                        {venue.category}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <h3 className="text-lg font-bold text-slate-800 mb-2 capitalize group-hover:text-blue-600 transition-colors line-clamp-1">
                                        {venue.category} in {venue.address?.city || 'Unknown City'}
                                    </h3>
                                    <p className="text-slate-500 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
                                        {venue.description || 'No description provided.'}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div className="flex items-center text-slate-500 text-sm gap-1">
                                            <Location size="16" />
                                            <span className="font-medium">{venue.address?.city || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center text-green-600 text-sm font-semibold gap-1">
                                            <TickCircle size="16" variant="Bold" />
                                            <span>{t('common.active')}</span>
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
        </div>
    );
};

export default Venue;
