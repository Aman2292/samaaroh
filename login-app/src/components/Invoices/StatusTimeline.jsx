import React from 'react';
import { TickCircle, Clock, Send, DocumentText } from 'iconsax-react';

const StatusTimeline = ({ invoice }) => {
    const statuses = [
        { key: 'draft', label: 'Draft', icon: DocumentText, color: 'gray', date: invoice.createdAt },
        { key: 'sent', label: 'Sent', icon: Send, color: 'blue', date: invoice.sentAt },
        { key: 'paid', label: 'Paid', icon: TickCircle, color: 'green', date: invoice.paidAt || (invoice.status === 'paid' ? invoice.updatedAt : null) }
    ];

    const getCurrentStatusIndex = () => {
        if (invoice.status === 'cancelled') return -1;
        if (invoice.status === 'paid') return 2;
        if (invoice.status === 'sent' || invoice.status === 'overdue' || invoice.status === 'partial') return 1;
        return 0;
    };

    const currentIndex = getCurrentStatusIndex();

    if (invoice.status === 'cancelled') {
        return (
            <div className="flex items-center space-x-2 p-4 bg-gray-100 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                    <Clock size={18} className="text-white" />
                </div>
                <div>
                    <p className="font-medium text-gray-900">Cancelled</p>
                    {invoice.voidedAt && <p className="text-sm text-gray-600">{new Date(invoice.voidedAt).toLocaleDateString('en-IN')}</p>}
                    {invoice.voidReason && <p className="text-xs text-gray-500 mt-1">Reason: {invoice.voidReason}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="py-4">
            <div className="flex items-center justify-between">
                {statuses.map((status, index) => {
                    const Icon = status.icon;
                    const isActive = index <= currentIndex;
                    const isCurrent = index === currentIndex;
                    const colorClass = isActive ? (status.color === 'gray' ? 'bg-gray-500' : status.color === 'blue' ? 'bg-blue-500' : 'bg-green-500') : 'bg-gray-200';
                    const textColor = isActive ? 'text-white' : 'text-gray-400';

                    return (
                        <React.Fragment key={status.key}>
                            <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass} ${textColor}`}>
                                    <Icon size={20} variant={isActive ? 'Bold' : 'Outline'} />
                                </div>
                                <p className={`text-xs font-medium mt-2 ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{status.label}</p>
                                {status.date && isActive && <p className="text-xs text-gray-500 mt-1">{new Date(status.date).toLocaleDateString('en-IN')}</p>}
                            </div>
                            {index < statuses.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-2 ${index < currentIndex ? (status.color === 'gray' ? 'bg-gray-500' : 'bg-blue-500') : 'bg-gray-200'}`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
            {invoice.status === 'overdue' && (
                <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r">
                    <p className="text-sm font-medium text-red-800">⚠️ Overdue by {Math.ceil((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24))} days</p>
                </div>
            )}
        </div>
    );
};

export default StatusTimeline;
