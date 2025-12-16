import React from 'react';

/**
 * SecondaryButton Component
 * 
 * Matches the PrimaryButton global design but as an Outline variant.
 * - Border: Gradient (#7F5EFF to #997FFF)
 * - Background: White (Negative space)
 * - Text: Purple (#7F5EFF)
 * - Hover: Slight purple glow and lift
 */
const SecondaryButton = ({
    children,
    onClick,
    icon: Icon,
    className = '',
    type = 'button',
    disabled = false,
    fullWidth = false
}) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
                relative group flex items-center justify-center gap-2 px-3 py-2 rounded-xl
                font-inter font-medium text-[#7F5EFF] bg-white
                transition-all duration-200
                hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(108,80,224,0.15)] hover:brightness-105
                active:translate-y-0 active:brightness-95
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none
                ${fullWidth ? 'w-full' : ''}
                ${className}
            `}
            style={{
                // Gradient Border Trick:
                // 1. White background (padding-box) trims the content area
                // 2. Gradient background (border-box) shows through the transparent border
                background: `
                    linear-gradient(#fff, #fff) padding-box,
                    linear-gradient(to right, #7F5EFF, #997FFF) border-box
                `,
                border: '2px solid transparent',
            }}
        >
            {Icon && <Icon size="20" color="#7F5EFF" variant="Bold" />}
            <span>{children}</span>
        </button>
    );
};

export default SecondaryButton;
