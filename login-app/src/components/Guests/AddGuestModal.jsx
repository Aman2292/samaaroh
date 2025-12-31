import React, { useState, useEffect } from 'react';
import { CloseCircle } from 'iconsax-react';
import { toast } from 'react-toastify';

const AddGuestModal = ({ eventId, guest, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        guestType: 'friend',
        side: 'neutral',
        plusOne: false,
        dietaryRestrictions: [],
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        if (guest) {
            setFormData({
                firstName: guest.firstName || '',
                lastName: guest.lastName || '',
                email: guest.email || '',
                phone: guest.phone || '',
                guestType: guest.guestType || 'friend',
                side: guest.side || 'neutral',
                plusOne: guest.plusOne || false,
                dietaryRestrictions: guest.dietaryRestrictions || [],
                notes: guest.notes || ''
            });
        }
    }, [guest]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = guest
                ? `http://localhost:5001/api/guests/${guest._id}`
                : 'http://localhost:5001/api/guests';

            const method = guest ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ ...formData, eventId })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(guest ? 'Guest updated successfully' : 'Guest added successfully');
                onSuccess();
                onClose();
            } else {
                toast.error(data.error || 'Operation failed');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {guest ? 'Edit Guest' : 'Add Guest'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <CloseCircle size="28" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                First Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Last Name
                            </label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Guest Type
                            </label>
                            <select
                                value={formData.guestType}
                                onChange={(e) => setFormData({ ...formData, guestType: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="family">Family</option>
                                <option value="friend">Friend</option>
                                <option value="colleague">Colleague</option>
                                <option value="vip">VIP</option>
                                <option value="vendor">Vendor</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Side
                            </label>
                            <select
                                value={formData.side}
                                onChange={(e) => setFormData({ ...formData, side: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="bride">Bride</option>
                                <option value="groom">Groom</option>
                                <option value="both">Both</option>
                                <option value="neutral">Neutral</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.plusOne}
                                    onChange={(e) => setFormData({ ...formData, plusOne: e.target.checked })}
                                    className="rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">Plus One Allowed</span>
                            </label>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notes
                            </label>
                            <textarea
                                rows="3"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : (guest ? 'Update Guest' : 'Add Guest')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddGuestModal;
