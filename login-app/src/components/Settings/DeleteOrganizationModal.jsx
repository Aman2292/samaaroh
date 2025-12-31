import React, { useState } from 'react';
import { Eye, EyeSlash } from 'iconsax-react';
import { toast } from 'react-toastify';

const DeleteOrganizationModal = ({ isOpen, onClose, organization, stats, onSuccess }) => {
    const [formData, setFormData] = useState({
        organizationName: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.organizationName !== organization?.name) {
            toast.error('Organization name does not match');
            return;
        }

        if (!formData.password) {
            toast.error('Please enter your password');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('https://samaaroh-1.onrender.com/api/organization', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Organization deleted successfully');
                onSuccess();
                // Logout user
                setTimeout(() => {
                    localStorage.removeItem('userInfo');
                    window.location.href = '/';
                }, 2000);
            } else {
                toast.error(data.error || 'Failed to delete organization');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-red-600 mb-4">Delete Organization</h3>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-800 font-semibold mb-2">
                        ⚠️ This action cannot be undone!
                    </p>
                    <p className="text-sm text-red-700">
                        This will permanently delete:
                    </p>
                    <ul className="text-sm text-red-700 mt-2 space-y-1 list-disc list-inside">
                        <li>{stats?.clients || 0} clients</li>
                        <li>{stats?.events || 0} events</li>
                        <li>{stats?.payments || 0} payments</li>
                        <li>{stats?.users || 0} team members</li>
                    </ul>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Organization Name Confirmation */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Type organization name to confirm: <strong>{organization?.name}</strong>
                        </label>
                        <input
                            type="text"
                            value={formData.organizationName}
                            onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Enter organization name"
                            required
                        />
                    </div>

                    {/* Password Confirmation */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Confirm Your Password *
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeSlash size="20" /> : <Eye size="20" />}
                            </button>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            disabled={loading}
                        >
                            {loading ? 'Deleting...' : 'Delete Organization'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeleteOrganizationModal;
