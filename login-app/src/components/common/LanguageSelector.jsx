import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Global } from 'iconsax-react';
import { toast } from 'react-toastify';

const LanguageSelector = ({ currentLanguage = 'en', onLanguageChange }) => {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(false);

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    const handleLanguageChange = async (newLanguage) => {
        if (newLanguage === currentLanguage) return;

        setLoading(true);
        try {
            // Update language preference in backend
            const response = await fetch('https://samaaroh-1.onrender.com/api/users/language', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ preferredLanguage: newLanguage })
            });

            const data = await response.json();

            if (response.ok) {
                // Update localStorage
                localStorage.setItem('preferredLanguage', newLanguage);

                // Update i18n language
                i18n.changeLanguage(newLanguage);

                // Update userInfo in localStorage
                const updatedUserInfo = { ...userInfo, preferredLanguage: newLanguage };
                localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));

                // Call parent callback if provided
                if (onLanguageChange) {
                    onLanguageChange(newLanguage);
                }

                toast.success(t('settings.languageUpdated') || 'Language updated successfully');
            } else {
                toast.error(data.error || 'Failed to update language preference');
            }
        } catch (error) {
            console.error('Language update error:', error);
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('settings.languagePreference') || 'Language Preference'}
            </label>
            <div className="relative">
                <Global
                    size="20"
                    color="#64748b"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10"
                    variant="Outline"
                />
                <select
                    value={currentLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    disabled={loading}
                    className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all appearance-none bg-white cursor-pointer text-slate-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <option value="en">{t('auth.register.english') || 'English'}</option>
                    <option value="hi">{t('auth.register.hindi') || 'हिंदी (Hindi)'}</option>
                    <option value="mr">{t('auth.register.marathi') || 'मराठी (Marathi)'}</option>
                    <option value="gu">{t('auth.register.gujarati') || 'ગુજરાતી (Gujarati)'}</option>
                    <option value="bn">{t('auth.register.bengali') || 'বাংলা (Bengali)'}</option>
                    <option value="ta">{t('auth.register.tamil') || 'தமிழ் (Tamil)'}</option>
                    <option value="te">{t('auth.register.telugu') || 'తెలుగు (Telugu)'}</option>
                    <option value="kn">{t('auth.register.kannada') || 'ಕನ್ನಡ (Kannada)'}</option>
                    <option value="ml">{t('auth.register.malayalam') || 'മലയാളം (Malayalam)'}</option>
                </select>
                {/* Custom dropdown arrow */}
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                    ) : (
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    )}
                </div>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
                {t('settings.languageHint') || 'Changes take effect immediately across the application'}
            </p>
        </div>
    );
};

export default LanguageSelector;
