import React, { useState } from 'react';
import { Box, Add, Edit2, Trash, TickCircle, CloseCircle, Money, People, Note } from 'iconsax-react';
import { toast } from 'react-toastify';

const VenuePackages = ({ venueData, onUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [loading, setLoading] = useState(false);

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    const initialFormState = {
        name: 'Silver',
        basePrice: '',
        maxGuests: '',
        extraGuestPrice: '',
        description: '',
        inclusions: ['']
    };

    const [formData, setFormData] = useState(initialFormState);

    const handleOpenModal = (pkg = null) => {
        if (pkg) {
            setEditingPackage(pkg);
            setFormData({
                name: pkg.name || 'Silver',
                basePrice: pkg.basePrice || '',
                maxGuests: pkg.maxGuests || '',
                extraGuestPrice: pkg.extraGuestPrice || '',
                description: pkg.description || '',
                inclusions: pkg.inclusions && pkg.inclusions.length > 0 ? pkg.inclusions : ['']
            });
        } else {
            setEditingPackage(null);
            setFormData(initialFormState);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPackage(null);
        setFormData(initialFormState);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleInclusionChange = (index, value) => {
        const newInclusions = [...formData.inclusions];
        newInclusions[index] = value;
        setFormData(prev => ({ ...prev, inclusions: newInclusions }));
    };

    const addInclusion = () => {
        setFormData(prev => ({ ...prev, inclusions: [...prev.inclusions, ''] }));
    };

    const removeInclusion = (index) => {
        const newInclusions = formData.inclusions.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, inclusions: newInclusions }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Filter empty inclusions
        const cleanedData = {
            ...formData,
            inclusions: formData.inclusions.filter(i => i.trim() !== '')
        };

        try {
            const url = editingPackage
                ? `https://samaaroh-1.onrender.com/api/venue/${venueData._id}/packages/${editingPackage._id}`
                : `https://samaaroh-1.onrender.com/api/venue/${venueData._id}/packages`;

            const method = editingPackage ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify(cleanedData)
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(`Package ${editingPackage ? 'updated' : 'added'} successfully`);
                onUpdate();
                handleCloseModal();
            } else {
                toast.error(data.error || 'Failed to save package');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (packageId) => {
        if (!window.confirm('Are you sure you want to delete this package?')) return;

        try {
            const response = await fetch(`https://samaaroh-1.onrender.com/api/venue/${venueData._id}/packages/${packageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Package deleted successfully');
                onUpdate();
            } else {
                toast.error(data.error || 'Failed to delete package');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Box size="24" color="#4f46e5" />
                    Pricing Packages
                </h3>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-md shadow-primary-200"
                >
                    <Add size="20" color="#FFFFFF" />
                    <span>Add Package</span>
                </button>
            </div>

            {(!venueData.packages || venueData.packages.length === 0) ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Box size="48" color="#cbd5e1" variant="Bulk" className="mx-auto mb-3" />
                    <p className="text-slate-500">No packages added yet</p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="mt-4 text-primary-600 font-medium hover:underline"
                    >
                        Create your first package
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {venueData.packages.map((pkg) => (
                        <div key={pkg._id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 relative group">
                            <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleOpenModal(pkg)}
                                    className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-primary-50 hover:text-primary-600 transition-colors"
                                >
                                    <Edit2 size="16" color="#475569" />
                                </button>
                                <button
                                    onClick={() => handleDelete(pkg._id)}
                                    className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"
                                >
                                    <Trash size="16" color="#475569" />
                                </button>
                            </div>

                            <div className="mb-4">
                                <h4 className="text-xl font-bold text-slate-800">{pkg.name}</h4>
                                <p className="text-3xl font-bold text-primary-600 mt-2">
                                    ₹{pkg.basePrice?.toLocaleString()}
                                </p>
                                <p className="text-sm text-slate-500">Base Price</p>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center text-slate-600 text-sm">
                                    <People size="18" className="mr-2 text-slate-400" color="#94a3b8" />
                                    Up to {pkg.maxGuests} Guests
                                </div>
                                <div className="flex items-center text-slate-600 text-sm">
                                    <Money size="18" className="mr-2 text-slate-400" color="#94a3b8" />
                                    ₹{pkg.extraGuestPrice}/extra guest
                                </div>
                                {pkg.description && (
                                    <div className="flex items-start text-slate-600 text-sm">
                                        <Note size="18" className="mr-2 text-slate-400 mt-0.5" color="#94a3b8" />
                                        <span className="line-clamp-2">{pkg.description}</span>
                                    </div>
                                )}
                            </div>

                            {pkg.inclusions && pkg.inclusions.length > 0 && (
                                <div className="border-t border-slate-100 pt-4">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Inclusions</p>
                                    <ul className="space-y-1">
                                        {pkg.inclusions.slice(0, 3).map((inc, i) => (
                                            <li key={i} className="flex items-start text-sm text-slate-600">
                                                <TickCircle size="14" className="mr-2 text-green-500 mt-0.5 flex-shrink-0" variant="Bold" color="#22c55e" />
                                                <span className="line-clamp-1">{inc}</span>
                                            </li>
                                        ))}
                                        {pkg.inclusions.length > 3 && (
                                            <li className="text-xs text-primary-600 font-medium pl-6">
                                                +{pkg.inclusions.length - 3} more items
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-bold text-slate-800">
                                {editingPackage ? 'Edit Package' : 'Add New Package'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                                <CloseCircle size="24" color="#94a3b8" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Package Name</label>
                                    <select
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        <option value="Silver">Silver Package</option>
                                        <option value="Gold">Gold Package</option>
                                        <option value="Platinum">Platinum Package</option>
                                        <option value="Custom">Custom Package</option>
                                    </select>
                                </div>
                                {formData.name === 'Custom' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Custom Name</label>
                                        <input
                                            type="text"
                                            name="customName"
                                            disabled
                                            placeholder="Custom name support coming soon"
                                            className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-slate-50"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Base Price (₹)</label>
                                    <input
                                        type="number"
                                        name="basePrice"
                                        value={formData.basePrice}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Guests</label>
                                    <input
                                        type="number"
                                        name="maxGuests"
                                        value={formData.maxGuests}
                                        onChange={handleChange}
                                        required
                                        min="1"
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Extra Guest Price (₹)</label>
                                    <input
                                        type="number"
                                        name="extraGuestPrice"
                                        value={formData.extraGuestPrice}
                                        onChange={handleChange}
                                        min="0"
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Inclusions</label>
                                <div className="space-y-2">
                                    {formData.inclusions.map((inclusion, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={inclusion}
                                                onChange={(e) => handleInclusionChange(index, e.target.value)}
                                                placeholder="e.g., Welcome Drinks"
                                                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeInclusion(index)}
                                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <CloseCircle size="20" color="#94a3b8" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addInclusion}
                                        className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1"
                                    >
                                        <Add size="16" color="#4f46e5" />
                                        Add Inclusion
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center space-x-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 shadow-lg shadow-primary-200"
                                >
                                    {loading ? 'Saving...' : (editingPackage ? 'Update Package' : 'Create Package')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VenuePackages;
