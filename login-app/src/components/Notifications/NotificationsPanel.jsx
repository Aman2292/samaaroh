import React, { useState, useEffect } from 'react';
import { CloseCircle } from 'iconsax-react';
import { toast } from 'react-toastify';
import NotificationItem from './NotificationItem';

const NotificationsPanel = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5001/api/notifications', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setNotifications(data.data);
                setUnreadCount(data.unreadCount);
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

    const groupNotificationsByDate = (notifications) => {
        const groups = {
            today: [],
            yesterday: [],
            thisWeek: [],
            older: []
        };

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        notifications.forEach(notification => {
            const notifDate = new Date(notification.createdAt);
            const notifDay = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());

            if (notifDay.getTime() === today.getTime()) {
                groups.today.push(notification);
            } else if (notifDay.getTime() === yesterday.getTime()) {
                groups.yesterday.push(notification);
            } else if (notifDate >= weekAgo) {
                groups.thisWeek.push(notification);
            } else {
                groups.older.push(notification);
            }
        });

        return groups;
    };

    if (!isOpen) return null;

    const groupedNotifications = groupNotificationsByDate(notifications);

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-30 z-40"
                onClick={onClose}
            ></div>

            {/* Panel */}
            <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <p className="text-xs text-slate-500 mt-1">{unreadCount} unread</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <CloseCircle size="24" />
                    </button>
                </div>

                {/* Mark All as Read Button */}
                {unreadCount > 0 && (
                    <div className="px-4 py-2 border-b border-slate-100">
                        <button
                            onClick={handleMarkAllAsRead}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Mark all as read
                        </button>
                    </div>
                )}

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                            <p className="text-sm text-slate-500 mt-2">Loading notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-slate-500">No notifications yet</p>
                            <p className="text-sm text-slate-400 mt-1">We'll notify you when something happens</p>
                        </div>
                    ) : (
                        <>
                            {groupedNotifications.today.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                                        <p className="text-xs font-semibold text-slate-600 uppercase">Today</p>
                                    </div>
                                    {groupedNotifications.today.map(notification => (
                                        <NotificationItem
                                            key={notification._id}
                                            notification={notification}
                                            onMarkAsRead={handleMarkAsRead}
                                        />
                                    ))}
                                </div>
                            )}

                            {groupedNotifications.yesterday.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                                        <p className="text-xs font-semibold text-slate-600 uppercase">Yesterday</p>
                                    </div>
                                    {groupedNotifications.yesterday.map(notification => (
                                        <NotificationItem
                                            key={notification._id}
                                            notification={notification}
                                            onMarkAsRead={handleMarkAsRead}
                                        />
                                    ))}
                                </div>
                            )}

                            {groupedNotifications.thisWeek.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                                        <p className="text-xs font-semibold text-slate-600 uppercase">This Week</p>
                                    </div>
                                    {groupedNotifications.thisWeek.map(notification => (
                                        <NotificationItem
                                            key={notification._id}
                                            notification={notification}
                                            onMarkAsRead={handleMarkAsRead}
                                        />
                                    ))}
                                </div>
                            )}

                            {groupedNotifications.older.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                                        <p className="text-xs font-semibold text-slate-600 uppercase">Older</p>
                                    </div>
                                    {groupedNotifications.older.map(notification => (
                                        <NotificationItem
                                            key={notification._id}
                                            notification={notification}
                                            onMarkAsRead={handleMarkAsRead}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default NotificationsPanel;
