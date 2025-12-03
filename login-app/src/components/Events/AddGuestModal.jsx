import React, { useState } from 'react';
import { CloseCircle } from 'iconsax-react';
import { toast } from 'react-toastify';

const AddGuestModal = ({ eventId, isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        side: '',
        group: '',
        rsvpStatus: 'invited',
        headcount: 1,
        plusOnes: 0,
        dietaryRestrictions: '',
        specialNotes: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    if (!isOpen) return null;

    const validateForm = () => {
        const newErrors = {};

        // Name validation
        if (!formData.name || formData.name.trim().length < 2) {
            newErrors.name = 'Name is required (minimum 2 characters)';
        }

        // Side validation
        if (!formData.side) {
            newErrors.side = 'Please select a side';
        }

        // Group validation
        if (!formData.group) {
            newErrors.group = 'Please select a group';
        }

        // Phone validation (optional but must be valid if provided)
        if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
            newErrors.phone = 'Phone must be 10 digits';
        }

        // Email validation (optional but must be valid if provided)
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        // Headcount validation
        if (formData.headcount < 1) {
            newErrors.headcount = 'Headcount must be at least 1';
        }

        // Plus ones validation
        if (formData.plusOnes < 0) {
            newErrors.plusOnes = 'Plus ones cannot be negative';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the validation errors');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`http://localhost:5001/api/events/${eventId}/guests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Guest added successfully!');
                onSuccess(); // Refresh guest list
                handleClose();
            } else {
                toast.error(data.error || 'Failed to add guest');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            phone: '',
            email: '',
            side: '',
            group: '',
            rsvpStatus: 'invited',
            headcount: 1,
            plusOnes: 0,
            dietaryRestrictions: '',
            specialNotes: ''
        });
        setErrors({});
        onClose();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-800">Add Guest</h2>
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <CloseCircle size="28" color="#64748b" variant="Outline" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.name ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                    placeholder="Enter guest name"
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.phone ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                    placeholder="9876543210"
                                />
                                {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.email ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                    placeholder="guest@example.com"
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Classification */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Classification</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Side */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Side <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="side"
                                    value={formData.side}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.side ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                >
                                    <option value="">Select side</option>
                                    <option value="bride">Bride</option>
                                    <option value="groom">Groom</option>
                                    <option value="both">Both</option>
                                    <option value="vendor">Vendor</option>
                                </select>
                                {errors.side && <p className="mt-1 text-sm text-red-500">{errors.side}</p>}
                            </div>

                            {/* Group */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Group <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="group"
                                    value={formData.group}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.group ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                >
                                    <option value="">Select group</option>
                                    <option value="family">Family</option>
                                    <option value="friends">Friends</option>
                                    <option value="vip">VIP</option>
                                    <option value="vendor">Vendor</option>
                                    <option value="other">Other</option>
                                </select>
                                {errors.group && <p className="mt-1 text-sm text-red-500">{errors.group}</p>}
                            </div>
                        </div>
                    </div>

                    {/* RSVP & Attendance */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">RSVP & Attendance</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* RSVP Status */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    RSVP Status
                                </label>
                                <select
                                    name="rsvpStatus"
                                    value={formData.rsvpStatus}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="invited">Invited</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="declined">Declined</option>
                                    <option value="tentative">Tentative</option>
                                </select>
                            </div>

                            {/* Headcount */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Headcount <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="headcount"
                                    value={formData.headcount}
                                    onChange={handleChange}
                                    min="1"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.headcount ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                />
                                {errors.headcount && <p className="mt-1 text-sm text-red-500">{errors.headcount}</p>}
                            </div>

                            {/* Plus Ones */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Plus Ones
                                </label>
                                <input
                                    type="number"
                                    name="plusOnes"
                                    value={formData.plusOnes}
                                    onChange={handleChange}
                                    min="0"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.plusOnes ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                />
                                {errors.plusOnes && <p className="mt-1 text-sm text-red-500">{errors.plusOnes}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Special Requirements */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Special Requirements</h3>
                        <div className="space-y-4">
                            {/* Dietary Restrictions */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Dietary Restrictions
                                </label>
                                <textarea
                                    name="dietaryRestrictions"
                                    value={formData.dietaryRestrictions}
                                    onChange={handleChange}
                                    rows="2"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="E.g., Vegetarian, Vegan, Gluten-free, Allergies..."
                                />
                            </div>

                            {/* Special Notes */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Special Notes
                                </label>
                                <textarea
                                    name="specialNotes"
                                    value={formData.specialNotes}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Any special requirements or notes..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? 'Adding...' : 'Add Guest'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddGuestModal;
