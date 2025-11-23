import React from 'react';
import { DocumentText } from 'iconsax-react';

const EmptyState = ({
    title = 'No data found',
    description = 'Get started by creating your first item',
    actionLabel,
    onAction,
    icon: Icon = DocumentText
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Icon size="32" color="#64748b" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
            <p className="text-slate-500 text-center mb-6 max-w-md">{description}</p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
