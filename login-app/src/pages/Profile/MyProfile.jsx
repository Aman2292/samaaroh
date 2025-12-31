import React, { useState, useEffect } from 'react';
import { User, Building, Calendar, ShieldSecurity, Camera, Global } from 'iconsax-react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import ChangePasswordModal from '../../components/Profile/ChangePasswordModal';
import LanguageSelector from '../../components/common/LanguageSelector';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const MyProfile = () => {
    const { t } = useTranslation();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: ''
    });
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
    const isSuperAdmin = userInfo.role === 'SUPER_ADMIN';

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5001/api/users/profile', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setProfile(data.data);
                setFormData({
                    name: data.data.name,
                    phone: data.data.phone || ''
                });
            } else {
                toast.error(data.error || 'Failed to fetch profile');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaveLoading(true);
            const response = await fetch('http://localhost:5001/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Profile updated successfully');
                setProfile(data.data);
                setEditing(false);

                // Update localStorage
                const updatedUserInfo = { ...userInfo, name: formData.name };
                localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
            } else {
                toast.error(data.error || 'Failed to update profile');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setSaveLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: profile.name,
            phone: profile.phone || ''
        });
        setEditing(false);
    };

    const getRelativeTime = (date) => {
        if (!date) return 'Never';
        const now = new Date();
        const loginDate = new Date(date);
        const diffMs = now - loginDate;
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return loginDate.toLocaleDateString('en-IN');
    };

    if (loading) {
        return (
            <div className="p-8">
                <LoadingSkeleton type="form" count={5} />
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">{t('settings.profile')}</h1>
                    <p className="text-slate-500 mt-1">{t('profile.manageInfo') || 'Manage your personal information and settings'}</p>
                </div>

                {/* Profile Photo Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">{t('profile.profilePhoto') || 'Profile Photo'}</h2>
                    <div className="flex items-center space-x-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-3xl font-bold">
                                {profile?.name?.charAt(0).toUpperCase()}
                            </div>
                            <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border border-slate-200 hover:bg-slate-50">
                                <Camera size="16" className="text-slate-600" />
                            </button>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 mb-2">{t('profile.uploadPhoto') || 'Upload a new profile photo'}</p>
                            <button className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm">
                                {t('common.comingSoon') || 'Coming Soon'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Personal Information */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">{t('profile.personalInfo') || 'Personal Information'}</h2>
                        {!editing && (
                            <button
                                onClick={() => setEditing(true)}
                                className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg text-sm font-medium"
                            >
                                {t('common.edit')}
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {t('auth.register.fullName')} *
                            </label>
                            {editing ? (
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            ) : (
                                <p className="text-slate-800 py-2">{profile?.name}</p>
                            )}
                        </div>

                        {/* Email (Read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {t('auth.register.email')}
                            </label>
                            <div className="relative">
                                <p className="text-slate-400 py-2">{profile?.email}</p>
                                <span className="text-xs text-slate-500">{t('profile.emailFixed') || 'Email cannot be changed for security reasons'}</span>
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {t('auth.register.phone')}
                            </label>
                            {editing ? (
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder={t('profile.enterPhone') || 'Enter phone number'}
                                />
                            ) : (
                                <p className="text-slate-800 py-2">{profile?.phone || t('profile.notProvided') || 'Not provided'}</p>
                            )}
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {t('profile.role') || 'Role'}
                            </label>
                            <p className="text-slate-800 py-2">
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
                                    {profile?.role?.replace('_', ' ')}
                                </span>
                            </p>
                        </div>
                    </div>

                    {editing && (
                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                                disabled={saveLoading}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                disabled={saveLoading}
                            >
                                {saveLoading ? (t('common.saving') || 'Saving...') : t('settings.saveChanges')}
                            </button>
                        </div>
                    )}
                </div>

                {/* Organization Information (if not SUPER_ADMIN) */}
                {!isSuperAdmin && profile?.organizationId && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                            <Building size="20" className="mr-2 text-primary-600" />
                            {t('profile.organizationInfo') || 'Organization Information'}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {t('profile.organizationName') || 'Organization Name'}
                                </label>
                                <p className="text-slate-800">{profile.organizationId.name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {t('auth.register.city')}
                                </label>
                                <p className="text-slate-800">{profile.organizationId.city || t('profile.notSpecified') || 'Not specified'}</p>
                            </div>
                        </div>
                        {userInfo.role === 'PLANNER_OWNER' && (
                            <div className="mt-4">
                                <a
                                    href="/settings"
                                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                >
                                    {t('profile.viewOrgSettings') || 'View Organization Settings'} →
                                </a>
                            </div>
                        )}
                    </div>
                )}

                {/* Language & Region Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                        <Global size="20" className="mr-2 text-primary-600" />
                        {t('profile.languageRegion') || 'Language & Region'}
                    </h2>
                    <div className="max-w-md">
                        <LanguageSelector
                            currentLanguage={profile?.preferredLanguage || userInfo.preferredLanguage || 'en'}
                            onLanguageChange={(lang) => {
                                // Update profile state if needed
                                if (profile) {
                                    setProfile({ ...profile, preferredLanguage: lang });
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Security Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                        <ShieldSecurity size="20" className="mr-2 text-primary-600" />
                        {t('profile.security') || 'Security'}
                    </h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-800 font-medium">{t('auth.login.password')}</p>
                            <p className="text-sm text-slate-500">{t('profile.lastChanged') || 'Last changed'}: {t('profile.never') || 'Never'}</p>
                        </div>
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                            {t('profile.changePassword') || 'Change Password'}
                        </button>
                    </div>
                </div>

                {/* Activity Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                        <Calendar size="20" className="mr-2 text-primary-600" />
                        {t('profile.activity') || 'Activity'}
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-slate-600">{t('profile.lastLogin') || 'Last Login'}</span>
                            <span className="text-slate-800 font-medium">
                                {getRelativeTime(profile?.lastLogin)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-slate-600">{t('profile.memberSince') || 'Member Since'}</span>
                            <span className="text-slate-800 font-medium">
                                {new Date(profile?.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-slate-600">{t('profile.accountStatus') || 'Account Status'}</span>
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                                {t('common.active')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* PLANNER Statistics */}
                {userInfo.role === 'PLANNER' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                            <Calendar size="20" className="mr-2 text-primary-600" />
                            Your Statistics
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 rounded-lg p-4">
                                <p className="text-sm text-blue-600 font-medium mb-1">Total Events Managed</p>
                                <p className="text-3xl font-bold text-blue-700">{profile?.stats?.totalEvents || 0}</p>
                                <p className="text-xs text-blue-600 mt-1">Where you are lead planner</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4">
                                <p className="text-sm text-green-600 font-medium mb-1">Clients Created</p>
                                <p className="text-3xl font-bold text-green-700">{profile?.stats?.clientsCreated || 0}</p>
                                <p className="text-xs text-green-600 mt-1">Clients you added</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4">
                                <p className="text-sm text-purple-600 font-medium mb-1">Events Completed</p>
                                <p className="text-3xl font-bold text-purple-700">{profile?.stats?.eventsCompleted || 0}</p>
                                <p className="text-xs text-purple-600 mt-1">Successfully finished</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* FINANCE Statistics */}
                {userInfo.role === 'FINANCE' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                            <Calendar size="20" className="mr-2 text-primary-600" />
                            Your Finance Statistics
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-green-50 rounded-lg p-4">
                                <p className="text-sm text-green-600 font-medium mb-1">Payments Processed</p>
                                <p className="text-3xl font-bold text-green-700">{profile?.stats?.paymentsProcessed || 0}</p>
                                <p className="text-xs text-green-600 mt-1">Total payments marked as paid</p>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-4">
                                <p className="text-sm text-blue-600 font-medium mb-1">Amount Processed</p>
                                <p className="text-3xl font-bold text-blue-700">₹{(profile?.stats?.amountProcessed || 0).toLocaleString('en-IN')}</p>
                                <p className="text-xs text-blue-600 mt-1">Total value processed</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Change Password Modal */}
                <ChangePasswordModal
                    isOpen={showPasswordModal}
                    onClose={() => setShowPasswordModal(false)}
                    onSuccess={() => setShowPasswordModal(false)}
                />
            </div>
        </div>
    );
};

export default MyProfile;
