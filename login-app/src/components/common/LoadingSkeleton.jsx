import React from 'react';

const LoadingSkeleton = ({ type = 'list', count = 3 }) => {
    if (type === 'card') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(count)].map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 animate-pulse">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                        <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'table') {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100">
                {[...Array(count)].map((_, i) => (
                    <div key={i} className="p-4 border-b border-slate-100 animate-pulse">
                        <div className="flex items-center space-x-4">
                            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                            <div className="h-4 bg-slate-200 rounded w-1/6"></div>
                            <div className="h-4 bg-slate-200 rounded w-1/6"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Default: list
    return (
        <div className="space-y-4">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
            ))}
        </div>
    );
};

export default LoadingSkeleton;
