import React, { useState, useEffect, useRef } from 'react';
import { Add, CloseCircle } from 'iconsax-react';
import { toast } from 'react-toastify';
import AddNotificationModal from './AddNotificationModal';

const NotificationDropdown = ({ onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showAddModal, setShowAddModal] = useState(false);
    const dropdownRef = useRef(null);

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
    const isPlannerOwner = userInfo.role === 'PLANNER_OWNER';

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

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5001/api/notifications', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setNotifications(data.data || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            const response = await fetch(`http://localhost:5001/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            if (response.ok) {
                setNotifications(notifications.map(n =>
                    n._id === notificationId ? { ...n, isRead: true } : n
                ));
                setUnreadCount(Math.max(0, unreadCount - 1));
            }
        } catch (error) {
            console.error('Failed to mark notification as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/notifications/mark-all-read', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            if (response.ok) {
                setNotifications(notifications.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
                toast.success('All notifications marked as read');
            }
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            default: return 'ℹ️';
        }
    };

    const formatTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <>
            <div
                ref={dropdownRef}
                className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 max-h-[600px] flex flex-col"
            >
                {/* Header */}
                <div className="px-5 py-3 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Notifications</h3>
                            {unreadCount > 0 && (
                                <p className="text-xs text-slate-500 mt-0.5">{unreadCount} unread</p>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Add Notification Button (Planner Owner Only) */}
                    {isPlannerOwner && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium shadow-sm"
                        >
                            <Add size="20" variant="Bold" />
                            <span className="text-sm">Add Notification</span>
                        </button>
                    )}
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto px-2">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-sm text-slate-500 mt-2">Loading...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-slate-500 text-sm">No notifications yet</p>
                            <p className="text-xs text-slate-400 mt-1">We'll notify you when something happens</p>
                        </div>
                    ) : (
                        <div className="py-2">
                            {notifications.slice(0, 10).map((notification) => (
                                <button
                                    key={notification._id}
                                    onClick={() => handleMarkAsRead(notification._id)}
                                    className={`w-full text-left px-3 py-3 hover:bg-slate-50 rounded-xl transition-colors ${!notification.isRead ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <h4 className={`text-sm font-semibold truncate ${!notification.isRead ? 'text-slate-900' : 'text-slate-700'
                                                    }`}>
                                                    {notification.title}
                                                </h4>
                                                {!notification.isRead && (
                                                    <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-600 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {formatTimeAgo(notification.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* View All Link */}
                {notifications.length > 0 && (
                    <div className="px-4 pt-2 border-t border-slate-100">
                        <button
                            onClick={() => {
                                // Navigate to notifications page or expand full panel
                                onClose();
                            }}
                            className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            View All Notifications
                        </button>
                    </div>
                )}
            </div>

            {/* Add Notification Modal */}
            <AddNotificationModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onNotificationAdded={fetchNotifications}
            />
        </>
    );
};

export default NotificationDropdown;
