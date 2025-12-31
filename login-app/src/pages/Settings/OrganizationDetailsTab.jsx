import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const OrganizationDetailsTab = ({ organization, onUpdate }) => {
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        city: '',
        address: '',
        website: ''
    });
    const [saveLoading, setSaveLoading] = useState(false);

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        if (organization) {
            setFormData({
                name: organization.name || '',
                phone: organization.phone || '',
                email: organization.email || '',
                city: organization.city || '',
                address: organization.address || '',
                website: organization.website || ''
            });
        }
    }, [organization]);

    const handleSave = async () => {
        try {
            setSaveLoading(true);
            const response = await fetch('https://samaaroh-1.onrender.com/api/organization/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Organization settings updated successfully');
                setEditing(false);
                onUpdate(data.data);
            } else {
                toast.error(data.error || 'Failed to update settings');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setSaveLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: organization.name || '',
            phone: organization.phone || '',
            email: organization.email || '',
            city: organization.city || '',
            address: organization.address || '',
            website: organization.website || ''
        });
        setEditing(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Organization Details</h3>
                    <p className="text-sm text-slate-500 mt-1">Manage your organization information</p>
                </div>
                {!editing && (
                    <button
                        onClick={() => setEditing(true)}
                        className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg text-sm font-medium"
                    >
                        Edit
                    </button>
                )}
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Organization Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Organization Name *
                    </label>
                    {editing ? (
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                        />
                    ) : (
                        <p className="text-slate-800 py-2">{organization?.name}</p>
                    )}
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Phone Number
                    </label>
                    {editing ? (
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Enter phone number"
                        />
                    ) : (
                        <p className="text-slate-800 py-2">{organization?.phone || 'Not provided'}</p>
                    )}
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email Address
                    </label>
                    {editing ? (
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Enter email address"
                        />
                    ) : (
                        <p className="text-slate-800 py-2">{organization?.email || 'Not provided'}</p>
                    )}
                </div>

                {/* City */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        City
                    </label>
                    {editing ? (
                        <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Enter city"
                        />
                    ) : (
                        <p className="text-slate-800 py-2">{organization?.city || 'Not provided'}</p>
                    )}
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Address
                    </label>
                    {editing ? (
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            rows="3"
                            placeholder="Enter full address"
                        />
                    ) : (
                        <p className="text-slate-800 py-2">{organization?.address || 'Not provided'}</p>
                    )}
                </div>

                {/* Website */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Website URL
                    </label>
                    {editing ? (
                        <input
                            type="url"
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="https://example.com"
                        />
                    ) : (
                        <p className="text-slate-800 py-2">
                            {organization?.website ? (
                                <a href={organization.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                                    {organization.website}
                                </a>
                            ) : (
                                'Not provided'
                            )}
                        </p>
                    )}
                </div>

                {/* Logo Upload (Coming Soon) */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Organization Logo
                    </label>
                    <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl font-bold">
                            {organization?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <button className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm">
                                Coming Soon
                            </button>
                            <p className="text-xs text-slate-500 mt-1">Upload your organization logo</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            {editing && (
                <div className="flex space-x-3 pt-4 border-t border-slate-200">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                        disabled={saveLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        disabled={saveLoading}
                    >
                        {saveLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default OrganizationDetailsTab;
