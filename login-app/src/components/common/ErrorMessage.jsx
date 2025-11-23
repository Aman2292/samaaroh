import React from 'react';
import { CloseCircle, Refresh2 } from 'iconsax-react';

const ErrorMessage = ({
    message = 'Something went wrong',
    onRetry,
    type = 'error' // 'error' | 'warning' | 'info'
}) => {
    const colors = {
        error: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-800',
            icon: 'text-red-600'
        },
        warning: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            text: 'text-yellow-800',
            icon: 'text-yellow-600'
        },
        info: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-800',
            icon: 'text-blue-600'
        }
    };

    const style = colors[type] || colors.error;

    return (
        <div className={`${style.bg} ${style.border} border rounded-lg p-4 flex items-start space-x-3`}>
            <CloseCircle size="20" className={style.icon} />
            <div className="flex-1">
                <p className={`${style.text} text-sm font-medium`}>{message}</p>
            </div>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className={`${style.text} hover:opacity-75 transition-opacity flex items-center space-x-1 text-sm font-medium`}
                >
                    <Refresh2 size="16" />
                    <span>Retry</span>
                </button>
            )}
        </div>
    );
};

export default ErrorMessage;
