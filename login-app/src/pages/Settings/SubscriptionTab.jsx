import React from 'react';
import { InfoCircle } from 'iconsax-react';

const SubscriptionTab = () => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-lg font-semibold text-slate-800">Subscription & Billing</h3>
                <p className="text-sm text-slate-500 mt-1">Manage your subscription plan and billing</p>
            </div>

            {/* Current Plan */}
            <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-6 border border-primary-100">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-lg font-semibold text-slate-800">Free Trial</h4>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                Active
                            </span>
                        </div>
                        <p className="text-slate-600 text-sm mb-4">
                            You're currently on a free trial with unlimited access to all features
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <InfoCircle size="16" className="text-blue-600" />
                            <span>Trial period: Unlimited</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Included */}
            <div>
                <h4 className="font-semibold text-slate-800 mb-4">Features Included</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                        'Unlimited Clients',
                        'Unlimited Events',
                        'Payment Tracking',
                        'Team Management',
                        'Activity Logs',
                        'Email Notifications',
                        'Priority Support',
                        'Advanced Analytics'
                    ].map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-slate-700 text-sm">{feature}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Upgrade Section (Placeholder) */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-2">Upgrade Your Plan</h4>
                <p className="text-slate-600 text-sm mb-4">
                    Subscription plans and billing management coming soon
                </p>
                <button className="px-4 py-2 bg-slate-300 text-slate-500 rounded-lg cursor-not-allowed" disabled>
                    Coming Soon
                </button>
            </div>

            {/* Billing History (Placeholder) */}
            <div>
                <h4 className="font-semibold text-slate-800 mb-4">Billing History</h4>
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                    <p className="text-slate-500">No billing history available</p>
                    <p className="text-sm text-slate-400 mt-1">Billing history will appear here once you upgrade to a paid plan</p>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionTab;
