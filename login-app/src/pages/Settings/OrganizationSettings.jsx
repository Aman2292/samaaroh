import React, { useState, useEffect } from 'react';
import { Setting2 } from 'iconsax-react';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { toast } from 'react-toastify';
import OrganizationDetailsTab from './OrganizationDetailsTab';
import SubscriptionTab from './SubscriptionTab';
import DangerZoneTab from './DangerZoneTab';

const OrganizationSettings = () => {
    const [activeTab, setActiveTab] = useState('details');
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        fetchOrganization();
    }, []);

    const fetchOrganization = async () => {
        try {
            setLoading(true);
            // Fetch organization details from user profile
            const response = await fetch('http://localhost:5001/api/users/profile', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();
            if (response.ok && data.data.organizationId) {
                setOrganization(data.data.organizationId);
            } else {
                toast.error('Failed to fetch organization details');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleOrganizationUpdate = (updatedOrg) => {
        setOrganization(updatedOrg);
    };

    const tabs = [
        { id: 'details', label: 'Organization Details', icon: Setting2 },
        { id: 'subscription', label: 'Subscription & Billing', icon: Setting2 },
        { id: 'danger', label: 'Danger Zone', icon: Setting2 }
    ];

    if (loading) {
        return (
            <div className="p-8">
                <LoadingSkeleton type="form" count={5} />
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">Organization Settings</h1>
                    <p className="text-slate-500 mt-1">Manage your organization preferences and settings</p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100">
                    {/* Tab Headers */}
                    <div className="border-b border-slate-200">
                        <div className="flex space-x-1 p-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'details' && (
                            <OrganizationDetailsTab
                                organization={organization}
                                onUpdate={handleOrganizationUpdate}
                            />
                        )}

                        {activeTab === 'subscription' && (
                            <SubscriptionTab />
                        )}

                        {activeTab === 'danger' && (
                            <DangerZoneTab organization={organization} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizationSettings;
