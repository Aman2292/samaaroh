import React from 'react';
import {
    InfoCircle,
    People,
    Calendar,
    MoneyRecive,
    Building,
    Lock,
    TickCircle
} from 'iconsax-react';
import { toast } from 'react-toastify';

const FeatureCard = ({ title, icon: Icon, enabled, subFeatures = [], onRequestAccess }) => (
    <div className={`relative flex flex-col h-full rounded-2xl transition-all duration-300 ${enabled
        ? 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
        : 'bg-slate-50 border border-slate-200 overflow-hidden'
        }`}>
        {/* Header */}
        <div className={`p-5 flex items-start justify-between border-b ${enabled ? 'border-slate-100' : 'border-slate-200'}`}>
            <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${enabled ? 'bg-primary-50 text-primary-600' : 'bg-slate-200 text-slate-500'
                    }`}>
                    <Icon size="22" color="currentColor" />
                </div>
                <div>
                    <h3 className={`font-semibold text-lg ${enabled ? 'text-slate-800' : 'text-slate-500'}`}>
                        {title}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                        {enabled ? (
                            <span className="inline-flex items-center space-x-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                <TickCircle size="12" color="currentColor" />
                                <span>Active</span>
                            </span>
                        ) : (
                            <span className="inline-flex items-center space-x-1 text-xs font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                                <Lock size="12" color="currentColor" />
                                <span>Locked</span>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Request Access Button (only if disabled) */}
            {!enabled && (
                <button
                    onClick={() => onRequestAccess(title)}
                    className="text-xs font-semibold text-primary-600 bg-white border border-primary-200 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                >
                    Request Access
                </button>
            )}
        </div>

        {/* Content */}
        <div className={`p-5 flex-1 ${!enabled && 'opacity-60 grayscale'}`}>
            <div className="space-y-3">
                {subFeatures.map((sub, idx) => (
                    <div key={idx} className="flex items-center justify-between group">
                        <span className={`text-sm ${enabled ? 'text-slate-600' : 'text-slate-400'}`}>
                            {sub.label}
                        </span>
                        {enabled ? (
                            <div className="w-5 h-5 rounded-full bg-primary-100/50 flex items-center justify-center">
                                <TickCircle size="14" className="text-primary-600" color="currentColor" />
                            </div>
                        ) : (
                            <Lock size="14" className="text-slate-300" color="currentColor" />
                        )}
                    </div>
                ))}

                {subFeatures.length === 0 && (
                    <p className="text-sm text-slate-400 italic">No sub-features configured.</p>
                )}
            </div>
        </div>

        {/* Subtle background pattern for locked items */}
        {!enabled && (
            <div className="absolute inset-0 bg-slate-100/10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '16px 16px', opacity: 0.3 }}
            />
        )}
    </div>
);

const SubscriptionTab = ({ organization }) => {
    const f = organization?.subscribedFeatures || {};

    // Helper to check feature status safely
    const isEnabled = (val) => {
        if (typeof val === 'boolean') return val;
        if (typeof val === 'object' && val !== null) return val.access !== false;
        return false;
    };

    const isSubFeatureEnabled = (parent, key) => {
        if (!parent || typeof parent !== 'object') return false;
        return parent[key] !== false;
    };

    const handleRequestAccess = async (featureName) => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const response = await fetch('http://localhost:5001/api/notifications/request-access', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ featureName })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`Request sent for ${featureName}. Admin has been notified.`);
            } else {
                toast.error(data.error || 'Failed to send request');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header Section */}
            <div>
                <h3 className="text-2xl font-bold text-slate-900">Subscription & Billing</h3>
                <p className="text-slate-500 mt-1">Manage your subscribed features and billing details</p>
            </div>

            {/* Current Plan Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl">
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl"></div>

                <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-4 max-w-2xl">
                        <div className="flex items-center space-x-3">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 tracking-wide uppercase">
                                Current Plan
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                            Free Trial <span className="text-indigo-400">Plan</span>
                        </h2>
                        <p className="text-slate-300 text-lg leading-relaxed">
                            You are currently exploring the platform. Access to certain premium features may be restricted based on your organization's configuration.
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <button className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed" disabled>
                            Upgrade Plan (Coming Soon)
                        </button>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div>
                <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center space-x-2">
                    <Building size="24" className="text-primary-600" color="currentColor" />
                    <span>Feature Configuration</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Events Module */}
                    <FeatureCard
                        title="Events Module"
                        icon={Calendar}
                        enabled={isEnabled(f.events)}
                        onRequestAccess={handleRequestAccess}
                        subFeatures={[
                            { label: 'Guest List Management', enabled: isEnabled(f.events) && isSubFeatureEnabled(f.events, 'guests') },
                            { label: 'Event Payments', enabled: isEnabled(f.events) && isSubFeatureEnabled(f.events, 'payments') },
                            { label: 'Task Management', enabled: isEnabled(f.events) && isSubFeatureEnabled(f.events, 'tasks') }
                        ]}
                    />

                    {/* Team Management */}
                    <FeatureCard
                        title="Team Management"
                        icon={People}
                        enabled={isEnabled(f.team)}
                        onRequestAccess={handleRequestAccess}
                        subFeatures={[
                            { label: 'Add/Remove Members', enabled: isEnabled(f.team) && isSubFeatureEnabled(f.team, 'manage') },
                            { label: 'Export Data', enabled: isEnabled(f.team) && isSubFeatureEnabled(f.team, 'export') }
                        ]}
                    />

                    {/* Venue Management */}
                    <FeatureCard
                        title="Venue Management"
                        icon={Building}
                        enabled={isEnabled(f.venue)}
                        onRequestAccess={handleRequestAccess}
                        subFeatures={[
                            { label: 'Venue Profile', enabled: isEnabled(f.venue) && isSubFeatureEnabled(f.venue, 'profile') },
                            { label: 'Gallery', enabled: isEnabled(f.venue) && isSubFeatureEnabled(f.venue, 'gallery') },
                            { label: 'Packages', enabled: isEnabled(f.venue) && isSubFeatureEnabled(f.venue, 'packages') },
                            { label: 'Availability Calendar', enabled: isEnabled(f.venue) && isSubFeatureEnabled(f.venue, 'availability') },
                        ]}
                    />

                    {/* Global Payments */}
                    <FeatureCard
                        title="Global Payments"
                        icon={MoneyRecive}
                        enabled={isEnabled(f.payments)}
                        onRequestAccess={handleRequestAccess}
                        subFeatures={[
                            { label: 'Client Payments', enabled: isEnabled(f.payments) && isSubFeatureEnabled(f.payments, 'client') },
                            { label: 'Vendor Payments', enabled: isEnabled(f.payments) && isSubFeatureEnabled(f.payments, 'vendor') }
                        ]}
                    />

                    {/* Client Management (Standalone) */}
                    <FeatureCard
                        title="Client Management"
                        icon={People}
                        enabled={isEnabled(f.clients)}
                        onRequestAccess={handleRequestAccess}
                        subFeatures={[
                            { label: 'Client Database', enabled: true },
                            { label: 'Communication History', enabled: true }
                        ]}
                    />
                </div>
            </div>
        </div>
    );
};

export default SubscriptionTab;
