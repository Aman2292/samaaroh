import React from 'react';

/**
 * TertiaryButton Component
 * 
 * "Ghost" variant for low-emphasis actions (Back, Cancel, Inline Actions).
 * - Background: Transparent
 * - Text: Purple (#7F5EFF) to match theme
 * - Hover: Subtle Purple Tint (#7F5EFF @ 10%)
 * - No Border
 */
const TertiaryButton = ({
    children,
    onClick,
    icon: Icon,
    className = '',
    type = 'button',
    disabled = false,
    fullWidth = false,
    destructive = false // Option for red/destructive ghost buttons
}) => {
    const baseColor = destructive ? 'text-red-600' : 'text-[#7F5EFF]';
    const hoverBg = destructive ? 'hover:bg-red-50' : 'hover:bg-[#7F5EFF]/10';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
                relative group flex items-center justify-center gap-2 px-3 py-2 rounded-xl
                font-inter font-medium transition-all duration-200
                ${baseColor} bg-transparent
                ${hoverBg}
                disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-transparent
                ${fullWidth ? 'w-full' : ''}
                ${className}
            `}
        >
            {Icon && <Icon size="20" color="currentColor" variant="Bold" />}
            <span>{children}</span>
        </button>
    );
};

export default TertiaryButton;
