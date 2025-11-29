import React from 'react';
import { TrendUp, TrendDown } from 'iconsax-react';

const MetricCard = ({ title, value, change, icon: Icon, color = 'primary', prefix = '', onClick }) => {
    const isPositive = change && parseFloat(change) >= 0;

    const colorClasses = {
        primary: {
            bg: 'from-indigo-500 to-indigo-600',
            icon: 'text-white',
            text: 'text-white'
        },
        success: {
            bg: 'from-green-500 to-green-600',
            icon: 'text-white',
            text: 'text-white'
        },
        warning: {
            bg: 'from-orange-500 to-orange-600',
            icon: 'text-white',
            text: 'text-white'
        },
        danger: {
            bg: 'from-red-500 to-red-600',
            icon: 'text-white',
            text: 'text-white'
        },
        info: {
            bg: 'from-blue-500 to-blue-600',
            icon: 'text-white',
            text: 'text-white'
        }
    };

    const colors = colorClasses[color];

    return (
        <div
            onClick={onClick}
            className={`bg-gradient-to-br ${colors.bg} p-6 rounded-xl shadow-lg ${onClick ? 'cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1' : ''}`}
        >
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-white/90 font-medium text-sm uppercase tracking-wide">{title}</h3>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    {Icon && <Icon size={28} variant="Bold" color="#ffffff" />}
                </div>
            </div>
            <div className={`text-3xl font-bold mb-2 ${colors.text}`}>
                {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}
            </div>
            {change && (
                <div className="flex items-center space-x-1 text-white/90 text-sm">
                    {isPositive ? (
                        <TrendUp size="16" />
                    ) : (
                        <TrendDown size="16" />
                    )}
                    <span className="font-medium">{change}%</span>
                    <span className="text-white/70">vs last month</span>
                </div>
            )}
        </div>
    );
};

export default MetricCard;
