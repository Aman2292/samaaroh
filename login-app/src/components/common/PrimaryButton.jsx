import React from 'react';

/**
 * PrimaryButton Component
 * 
 * Implements the specific design specs:
 * - Fill: Linear Gradient (#7F5EFF to #997FFF)
 * - Stroke: Linear Gradient (#A089FF to #8C70FF)
 * - Drop Shadow 1: #6C50E0 (Spread 2px) - 3D Edge effect
 * - Drop Shadow 2: #000A1F (Blur 4px) - Soft Shadow
 * - Text Shadow: #6C50E0 (50% opacity)
 */
const PrimaryButton = ({
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
                font-inter font-medium text-white transition-all duration-200
                hover:-translate-y-0.5 hover:shadow-lg hover:brightness-110
                active:translate-y-0.5 active:shadow-[0_0_0_2px_#6C50E0]
                disabled:opacity-50 disabled:cursor-not-allowed
                ${fullWidth ? 'w-full' : ''}
                ${className}
            `}
            style={{
                // Dual background for Gradient Border + Gradient Fill
                // The first gradient is the padding-box (Content), the second is border-box (Border)
                background: `
                    linear-gradient(to right, #7F5EFF, #997FFF) padding-box,
                    linear-gradient(to right, #A089FF, #8C70FF) border-box
                `,
                border: '1px solid transparent',

                // Complex Shadow Stacking
                // 1. Solid Purple Ring (Spread 2px) -> #6C50E0
                // 2. Soft Black Shadow (Y:4, Blur:4) -> #000A1F @ 20%
                boxShadow: `
                    0px 0px 0px 2px #6C50E0,
                    0px 4px 4px rgba(0, 10, 31, 0.2)
                `,

                // Text Shadow
                textShadow: '0px 2px 4px rgba(108, 80, 224, 0.5)'
            }}
        >
            {Icon && <Icon size="20" color="#FFFFFF" variant="Bold" />}
            <span>{children}</span>
        </button>
    );
};

export default PrimaryButton;
