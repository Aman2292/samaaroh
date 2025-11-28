import React, { useState } from 'react';
import { Eye, EyeSlash } from 'iconsax-react';
import { toast } from 'react-toastify';
import Select from '../common/Select';

const TransferOwnershipModal = ({ isOpen, onClose, teamMembers, onSuccess }) => {
    const [formData, setFormData] = useState({
        newOwnerId: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.newOwnerId) {
            toast.error('Please select a new owner');
            return;
        }

        if (!formData.password) {
            toast.error('Please enter your password');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('http://localhost:5001/api/organization/transfer-ownership', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Ownership transferred successfully! Please log in again.');
                onSuccess();
                // Logout user
                setTimeout(() => {
                    localStorage.removeItem('userInfo');
                    window.location.href = '/';
                }, 2000);
            } else {
                toast.error(data.error || 'Failed to transfer ownership');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Filter team members to show only PLANNERs
    const planners = teamMembers.filter(member => member.role === 'PLANNER');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Transfer Ownership</h3>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-yellow-800">
                        <strong>Warning:</strong> This action cannot be undone. You will become a regular planner after the transfer.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* New Owner Selection */}
                    <div className="mb-4">
                        <Select
                            label="Select New Owner"
                            value={formData.newOwnerId}
                            onChange={(e) => setFormData({ ...formData, newOwnerId: e.target.value })}
                            required
                            options={planners.map(member => ({
                                value: member._id,
                                label: `${member.name} (${member.email})`
                            }))}
                            placeholder="Choose a team member"
                        />
                        {planners.length === 0 && (
                            <p className="text-xs text-red-500 mt-1">
                                No eligible team members found. Only users with PLANNER role can become owners.
                            </p>
                        )}
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
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
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
                            className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                            disabled={loading || planners.length === 0}
                        >
                            {loading ? 'Transferring...' : 'Transfer Ownership'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransferOwnershipModal;
