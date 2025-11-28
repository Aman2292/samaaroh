import React from 'react';

const PasswordStrengthIndicator = ({ password }) => {
    const calculateStrength = (pwd) => {
        if (!pwd) return { score: 0, label: '', color: '' };

        let score = 0;

        // Length check
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;

        // Character variety checks
        if (/[a-z]/.test(pwd)) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^a-zA-Z0-9]/.test(pwd)) score++;

        if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' };
        if (score <= 4) return { score: 2, label: 'Medium', color: 'bg-yellow-500' };
        return { score: 3, label: 'Strong', color: 'bg-green-500' };
    };

    const strength = calculateStrength(password);

    if (!password) return null;

    return (
        <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-600">Password Strength:</span>
                <span className={`text-xs font-medium ${strength.score === 1 ? 'text-red-600' :
                        strength.score === 2 ? 'text-yellow-600' :
                            'text-green-600'
                    }`}>
                    {strength.label}
                </span>
            </div>
            <div className="flex space-x-1">
                <div className={`h-1 flex-1 rounded ${strength.score >= 1 ? strength.color : 'bg-slate-200'}`}></div>
                <div className={`h-1 flex-1 rounded ${strength.score >= 2 ? strength.color : 'bg-slate-200'}`}></div>
                <div className={`h-1 flex-1 rounded ${strength.score >= 3 ? strength.color : 'bg-slate-200'}`}></div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
                Use 8+ characters with uppercase, lowercase, numbers & symbols
            </p>
        </div>
    );
};

export default PasswordStrengthIndicator;
