import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MoneyRecive, Calendar, People, InfoCircle } from 'iconsax-react';

const NotificationItem = ({ notification, onMarkAsRead }) => {
    const navigate = useNavigate();

    const getIcon = (type) => {
        const iconConfig = {
            payment_overdue: { Icon: MoneyRecive, color: 'text-red-600', bg: 'bg-red-100' },
            payment_received: { Icon: MoneyRecive, color: 'text-green-600', bg: 'bg-green-100' },
            team_joined: { Icon: People, color: 'text-blue-600', bg: 'bg-blue-100' },
            event_assigned: { Icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
            event_reminder: { Icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-100' },
            manual_alert: { Icon: InfoCircle, color: 'text-indigo-600', bg: 'bg-indigo-100' },
            system: { Icon: InfoCircle, color: 'text-slate-600', bg: 'bg-slate-100' }
        };

        const config = iconConfig[type] || iconConfig.system;
        const { Icon, color, bg } = config;

        return (
            <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size="20" className={color} />
            </div>
        );
    };

    const getRelativeTime = (date) => {
        const now = new Date();
        const notifDate = new Date(date);
        const diffMs = now - notifDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return notifDate.toLocaleDateString('en-IN');
    };

    const handleClick = () => {
        if (!notification.isRead) {
            onMarkAsRead(notification._id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 last:border-b-0 ${!notification.isRead ? 'bg-blue-50' : ''
                }`}
        >
            <div className="flex items-start space-x-3">
                {getIcon(notification.type)}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                        <p className="text-sm font-semibold text-slate-800">{notification.title}</p>
                        {!notification.isRead && (
                            <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1"></div>
                        )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-slate-400 mt-2">{getRelativeTime(notification.createdAt)}</p>
                </div>
            </div>
        </div>
    );
};

export default NotificationItem;
