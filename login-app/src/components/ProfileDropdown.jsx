import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogoutCurve, Setting2, DocumentText, Crown } from 'iconsax-react';

const ProfileDropdown = ({ userInfo, onLogout, onClose }) => {
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const isPlannerOwner = userInfo.role === 'PLANNER_OWNER';
    const isSuperAdmin = userInfo.role === 'SUPER_ADMIN';
    const showSubscription = isPlannerOwner || isSuperAdmin;

    // Get subscription plan (default to Free for Planner Owner)
    const subscriptionPlan = userInfo.subscriptionPlan || 'Free';

    const menuItems = [
        { icon: User, label: 'My Profile', path: '/profile' },
        { icon: Setting2, label: 'Settings', path: '/settings' },
        { icon: DocumentText, label: 'Activity Logs', path: '/activity-logs' },
    ];

    // Add subscription for Planner Owner and Super Admin
    if (showSubscription) {
        const getBadgeConfig = () => {
            if (isSuperAdmin) {
                return {
                    badge: 'UltraPRO',
                    badgeColor: 'bg-gradient-to-r from-purple-500 to-pink-500'
                };
            }
            // For Planner Owner - check subscription plan
            return {
                badge: subscriptionPlan.toUpperCase(),
                badgeColor: subscriptionPlan === 'Free'
                    ? 'bg-slate-400'
                    : 'bg-green-500'
            };
        };

        const badgeConfig = getBadgeConfig();
        menuItems.splice(1, 0, {
            icon: Crown,
            label: 'Subscription',
            path: '/settings',
            ...badgeConfig
        });
    }

    const handleNavigation = (path) => {
        navigate(path);
        onClose();
    };

    return (
        <div
            ref={dropdownRef}
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50"
        >
            {/* User Info Header */}
            <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {userInfo.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-base font-bold text-slate-900 truncate">{userInfo.name || 'User'}</div>
                        <div className="text-xs text-slate-500 truncate">{userInfo.email || ''}</div>
                        <div className="text-xs text-slate-700 font-semibold truncate mt-1 uppercase tracking-wide">
                            {userInfo.role?.replace('_', ' ') || ''}
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu Items */}
            <div className="py-2 px-2">
                {menuItems.map((item) => (
                    <button
                        key={item.path + item.label}
                        onClick={() => handleNavigation(item.path)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors text-left group"
                    >
                        <div className="flex items-center gap-3">
                            <item.icon size={22} color="currentColor" className="text-slate-700" />
                            <span className="text-sm font-medium text-slate-900">{item.label}</span>
                        </div>
                        {item.badge && (
                            <span className={`${item.badgeColor} text-white text-xs font-bold px-2.5 py-1 rounded-md`}>
                                {item.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Logout */}
            <div className="border-t border-slate-100 pt-2 px-2 mt-2">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 rounded-xl transition-colors text-left group"
                >
                    <LogoutCurve size={22} color="currentColor" className="text-red-600" />
                    <span className="text-sm font-medium text-red-600">Sign out</span>
                </button>
            </div>
        </div>
    );
};

export default ProfileDropdown;
