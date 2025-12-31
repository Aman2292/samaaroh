import React, { useState } from 'react';

import { LogoutCurve, Home, User, Calendar, People, MoneyRecive, HambergerMenu, ArrowLeft2, Building, UserOctagon, Setting2, DocumentText, Notification, TaskSquare, Folder2 } from 'iconsax-react';
import NotificationBell from './Notifications/NotificationBell';
import NotificationDropdown from './Notifications/NotificationDropdown';
import ProfileDropdown from './ProfileDropdown';
import GlobalSearch from './GlobalSearch';

import ModernSidebar from './ModernSidebar';

const Layout = ({ children, onLogout }) => {


    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
    // Default to true if not present to support legacy sessions/defaults
    const features = userInfo.subscribedFeatures || {
        clients: true,
        events: { access: true, guests: true, payments: true, tasks: true },
        payments: true,
        team: true,
        tasks: true,
        venue: true
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Modern Sidebar */}
            <ModernSidebar
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                userInfo={userInfo}
                features={features}
            />

            {/* Main Content with Header */}
            <main className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
                {/* Top Header Bar */}
                <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center sticky top-0 z-10">
                    {/* Left: Global Search */}
                    <GlobalSearch />

                    {/* Right: Notifications & Profile */}
                    <div className="flex items-center gap-3">
                        {/* Notification Dropdown */}
                        <div className="relative">
                            <NotificationBell onClick={() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen)} />

                            {isNotificationDropdownOpen && (
                                <NotificationDropdown
                                    onClose={() => setIsNotificationDropdownOpen(false)}
                                />
                            )}
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold hover:shadow-lg transition-shadow"
                            >
                                {userInfo.name?.charAt(0).toUpperCase() || 'U'}
                            </button>

                            {isProfileDropdownOpen && (
                                <ProfileDropdown
                                    userInfo={userInfo}
                                    onLogout={onLogout}
                                    onClose={() => setIsProfileDropdownOpen(false)}
                                />
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto bg-slate-50">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
