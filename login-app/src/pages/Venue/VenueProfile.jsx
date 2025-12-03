import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Edit2, Location, TickCircle } from 'iconsax-react';

const VenueProfile = ({ venueData, onUpdate }) => {
    const [formData, setFormData] = useState({
        category: 'venue',
        description: '',
        address: {
            street: '',
            city: '',
            state: '',
            zip: '',
            googleMapsUrl: ''
        },
        amenities: [],
        policies: {
            cancellation: '',
            refund: '',
            outsideCatering: false
        }
    });
    const [loading, setLoading] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (venueData) {
            resetForm();
        }
    }, [venueData]);

    const resetForm = () => {
        setFormData({
            category: venueData.category || 'venue',
            description: venueData.description || '',
            address: {
                street: venueData.address?.street || '',
                city: venueData.address?.city || '',
                state: venueData.address?.state || '',
                zip: venueData.address?.zip || '',
                googleMapsUrl: venueData.address?.googleMapsUrl || ''
            },
            amenities: venueData.amenities || [],
            policies: {
                cancellation: venueData.policies?.cancellation || '',
                refund: venueData.policies?.refund || '',
                outsideCatering: venueData.policies?.outsideCatering || false
            }
        });
        setIsDirty(false);
    };

    // Debounce map update
    const [debouncedAddress, setDebouncedAddress] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            const { street, city, state, zip } = formData.address;
            if (street || city) {
                setDebouncedAddress(`${street}, ${city}, ${state}, ${zip}`);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [formData.address]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setIsDirty(true);
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handlePolicyChange = (e) => {
        const { name, value, type, checked } = e.target;
        const field = name.split('.')[1];
        setIsDirty(true);
        setFormData(prev => ({
            ...prev,
            policies: {
                ...prev.policies,
                [field]: type === 'checkbox' ? checked : value
            }
        }));
    };

    const handleAmenityChange = (amenity) => {
        setIsDirty(true);
        setFormData(prev => {
            const amenities = prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity];
            return { ...prev, amenities };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5001/api/venue/${venueData._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Profile updated successfully');
                setIsDirty(false);
                onUpdate();
            } else {
                toast.error(data.error || 'Failed to update profile');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const commonAmenities = ['AC', 'Parking', 'Stage', 'Sound System', 'Projector', 'Wi-Fi', 'Changing Rooms', 'Power Backup'];

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Edit2 size="20" className="text-primary-600" />
                    Basic Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Venue Category</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="venue">Wedding Venue</option>
                            <option value="banquet">Banquet Hall</option>
                            <option value="resort">Resort</option>
                            <option value="hotel">Hotel</option>
                            <option value="lawn">Lawn/Farmhouse</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="4"
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Describe your venue..."
                        />
                    </div>
                </div>
            </div>

            {/* Address */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Location size="20" className="text-primary-600" />
                    Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Street Address</label>
                        <input
                            type="text"
                            name="address.street"
                            value={formData.address.street}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                        <input
                            type="text"
                            name="address.city"
                            value={formData.address.city}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                        <input
                            type="text"
                            name="address.state"
                            value={formData.address.state}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">ZIP Code</label>
                        <input
                            type="text"
                            name="address.zip"
                            value={formData.address.zip}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            name="address.googleMapsUrl"
                            value={formData.address.googleMapsUrl}
                            onChange={handleChange}
                            placeholder="https://maps.google.com/..."
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    {(formData.address.street || formData.address.city) && (
                        <div className="md:col-span-2 mt-4 rounded-xl overflow-hidden border border-slate-200 h-64">
                            <iframe
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                scrolling="no"
                                marginHeight="0"
                                marginWidth="0"
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(debouncedAddress)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                                title="Venue Location"
                            ></iframe>
                        </div>
                    )}
                </div>
            </div>

            {/* Amenities */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <TickCircle size="20" className="text-primary-600" />
                    Amenities
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {commonAmenities.map(amenity => (
                        <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.amenities.includes(amenity)}
                                onChange={() => handleAmenityChange(amenity)}
                                className="rounded text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-slate-700">{amenity}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Policies */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Policies</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cancellation Policy</label>
                        <textarea
                            name="policies.cancellation"
                            value={formData.policies.cancellation}
                            onChange={handlePolicyChange}
                            rows="3"
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Refund Policy</label>
                        <textarea
                            name="policies.refund"
                            value={formData.policies.refund}
                            onChange={handlePolicyChange}
                            rows="3"
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            name="policies.outsideCatering"
                            checked={formData.policies.outsideCatering}
                            onChange={handlePolicyChange}
                            className="rounded text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-slate-700 font-medium">Allow Outside Catering</span>
                    </label>
                </div>
            </div>

            {/* Action Buttons */}
            {isDirty && (
                <div className="flex justify-end space-x-4 pt-4 animate-fadeIn">
                    <button
                        type="button"
                        onClick={resetForm}
                        className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                    >
                        Discard Changes
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center space-x-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 shadow-lg shadow-primary-200"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                        {!loading && <TickCircle size="20" color="#FFFFFF" />}
                    </button>
                </div>
            )}
        </form>
    );
};

export default VenueProfile;
