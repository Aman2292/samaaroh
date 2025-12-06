import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { LogoutCurve, Home, User, Calendar, People, MoneyRecive, HambergerMenu, ArrowLeft2, Building, UserOctagon, Setting2, DocumentText, Notification, TaskSquare } from 'iconsax-react';
import NotificationBell from './Notifications/NotificationBell';
import NotificationsPanel from './Notifications/NotificationsPanel';

const Layout = ({ children, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    const canAccessClients = ['PLANNER_OWNER', 'PLANNER', 'FINANCE'].includes(userInfo.role);
    const canAccessEvents = true; // All roles can access events
    const canAccessTeam = userInfo.role === 'PLANNER_OWNER';
    const canAccessPayments = ['PLANNER_OWNER', 'FINANCE'].includes(userInfo.role);
    const canAccessVenue = userInfo.role === 'PLANNER_OWNER';
    const isSuperAdmin = userInfo.role === 'SUPER_ADMIN';

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    const menuItems = [
        { path: '/', icon: Home, label: 'Dashboard', show: true },
        { path: '/venue', icon: Building, label: 'Venue', show: canAccessVenue },
        { path: '/admin/organizations', icon: Building, label: 'Organizations', show: isSuperAdmin },
        { path: '/admin/users', icon: UserOctagon, label: 'Users', show: isSuperAdmin },
        { path: '/clients', icon: User, label: 'Clients', show: canAccessClients },
        { path: '/events', icon: Calendar, label: 'Events', show: canAccessEvents },
        { path: '/payments/outstanding', icon: MoneyRecive, label: 'Payments', show: canAccessPayments },
        { path: '/team', icon: People, label: 'Team', show: canAccessTeam },
        { path: '/settings', icon: Setting2, label: 'Settings', show: canAccessTeam },
        { path: '/activity-logs', icon: DocumentText, label: 'Activity Logs', show: canAccessTeam },
        { path: '/profile', icon: User, label: 'My Profile', show: true },

        { path: '/tasks', icon: TaskSquare, label: 'Tasks', show: userInfo.role === 'PLANNER_OWNER' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar - Fixed height, no scroll */}
            <aside className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 h-screen fixed ${isCollapsed ? 'w-20' : 'w-64'}`}>
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    {!isCollapsed && (
                        <div className="overflow-hidden">
                            <h1 className="text-xl font-bold text-primary-600 truncate">Samaaroh</h1>
                            <p className="text-xs text-slate-500 mt-1 truncate">{userInfo.role?.replace('_', ' ')}</p>
                        </div>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                    >
                        {isCollapsed ? (
                            <HambergerMenu size="20" color="currentColor" className="text-slate-600" />
                        ) : (
                            <ArrowLeft2 size="20" color="currentColor" className="text-slate-600" />
                        )}
                    </button>
                </div>

                {/* Navigation - Scrollable if needed */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => item.show && (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg w-full transition-colors ${isActive(item.path) && (item.path === '/' ? location.pathname === '/' : true)
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            title={isCollapsed ? item.label : ''}
                        >
                            <item.icon
                                size={isCollapsed ? "28" : "24"}
                                color="currentColor"
                            />
                            {!isCollapsed && <span className="font-medium">{item.label}</span>}
                        </button>
                    ))}
                </nav>

                {/* Footer - Fixed at bottom */}
                <div className="p-4 border-t border-slate-100 flex-shrink-0">
                    <div className={`mb-3 ${isCollapsed ? 'flex justify-center' : 'px-4 flex items-center justify-between'}`}>
                        {!isCollapsed && (
                            <div className="overflow-hidden">
                                <div className="text-sm font-bold text-slate-700 truncate">{userInfo.name || 'User'}</div>
                                <div className="text-xs text-slate-500 truncate">{userInfo.email || ''}</div>
                            </div>
                        )}
                        <NotificationBell onClick={() => setIsNotificationPanelOpen(true)} />
                    </div>
                    <button
                        onClick={onLogout}
                        className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors`}
                        title={isCollapsed ? 'Logout' : ''}
                    >
                        <LogoutCurve size={isCollapsed ? "28" : "24"} color="currentColor" />
                        {!isCollapsed && <span className="font-medium">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content - Offset by sidebar width */}
            <main className={`flex-1 overflow-y-auto transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
                {children}
            </main>

            <NotificationsPanel
                isOpen={isNotificationPanelOpen}
                onClose={() => setIsNotificationPanelOpen(false)}
            />
        </div>
    );
};

export default Layout;
