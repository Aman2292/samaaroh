import React, { useState, useEffect } from 'react';
import { Notification } from 'iconsax-react';

const NotificationBell = ({ onClick }) => {
    const [unreadCount, setUnreadCount] = useState(0);

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        fetchUnreadCount();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const response = await fetch('https://samaaroh-1.onrender.com/api/notifications?limit=1', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Failed to fetch unread count');
        }
    };

    return (
        <button
            onClick={onClick}
            className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
            <Notification size="24" color="#475569" />
            {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[20px]">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </button>
    );
};

export default NotificationBell;
