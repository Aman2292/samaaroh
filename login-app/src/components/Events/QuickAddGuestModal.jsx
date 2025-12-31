import React, { useState } from 'react';
import { CloseCircle } from 'iconsax-react';
import { toast } from 'react-toastify';

const QuickAddGuestModal = ({ eventId, isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        side: '',
        group: 'other',
        headcount: 1
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    if (!isOpen) return null;

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name || formData.name.trim().length < 2) {
            newErrors.name = 'Name is required';
        }

        if (!formData.side) {
            newErrors.side = 'Please select a side';
        }

        if (formData.headcount < 1) {
            newErrors.headcount = 'Headcount must be at least 1';
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
            const response = await fetch(`https://samaaroh-1.onrender.com/api/events/${eventId}/guests/quick-add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Guest added on-site!');
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
            side: '',
            group: 'other',
            headcount: 1
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
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Quick Add Guest</h2>
                        <p className="text-sm text-orange-100 mt-1">For on-site/last-minute guests</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-white hover:text-orange-100 transition-colors"
                    >
                        <CloseCircle size="28" color="#FFFFFF" variant="Outline" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Guest Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            autoFocus
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${errors.name ? 'border-red-500' : 'border-slate-300'
                                }`}
                            placeholder="Enter name"
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Side */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Side <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="side"
                                value={formData.side}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${errors.side ? 'border-red-500' : 'border-slate-300'
                                    }`}
                            >
                                <option value="">Select</option>
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
                                Group
                            </label>
                            <select
                                name="group"
                                value={formData.group}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                                <option value="family">Family</option>
                                <option value="friends">Friends</option>
                                <option value="vip">VIP</option>
                                <option value="vendor">Vendor</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
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
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${errors.headcount ? 'border-red-500' : 'border-slate-300'
                                }`}
                        />
                        {errors.headcount && <p className="mt-1 text-sm text-red-500">{errors.headcount}</p>}
                    </div>

                    {/* Info Box */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <p className="text-sm text-orange-800">
                            <strong>Quick Add:</strong> Guest will be marked as "Added On-site" and can be edited later with full details.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-3 pt-4">
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
                            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? 'Adding...' : 'Add Quickly'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuickAddGuestModal;
