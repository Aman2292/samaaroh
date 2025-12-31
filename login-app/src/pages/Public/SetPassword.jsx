import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, EyeSlash, TickCircle } from 'iconsax-react';
import { toast } from 'react-toastify';
import PasswordStrengthIndicator from '../../components/Profile/PasswordStrengthIndicator';

const SetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [invitationData, setInvitationData] = useState(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        verifyToken();
    }, [token]);

    const verifyToken = async () => {
        try {
            setLoading(true);
            const response = await fetch(`https://samaaroh-1.onrender.com/api/team/verify-invitation/${token}`);
            const data = await response.json();

            if (response.ok) {
                setInvitationData(data.data);
            } else {
                toast.error(data.error || 'Invalid or expired invitation');
                setTimeout(() => navigate('/'), 3000);
            }
        } catch (error) {
            toast.error('Failed to verify invitation');
            setTimeout(() => navigate('/'), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            setSubmitting(true);
            const response = await fetch('https://samaaroh-1.onrender.com/api/team/accept-invitation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Password set successfully! Redirecting to login...');
                setTimeout(() => navigate('/'), 2000);
            } else {
                toast.error(data.error || 'Failed to set password');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-500 to-purple-700 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-slate-600 mt-4">Verifying invitation...</p>
                </div>
            </div>
        );
    }

    if (!invitationData) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-500 to-purple-700 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TickCircle size="32" className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Welcome to Samaaroh!</h1>
                    <p className="text-slate-500 mt-2">Set your password to get started</p>
                </div>

                {/* Invitation Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-slate-700">
                        <strong>Name:</strong> {invitationData.name}
                    </p>
                    <p className="text-sm text-slate-700 mt-1">
                        <strong>Email:</strong> {invitationData.email}
                    </p>
                    <p className="text-sm text-slate-700 mt-1">
                        <strong>Organization:</strong> {invitationData.organizationName}
                    </p>
                    <p className="text-sm text-slate-700 mt-1">
                        <strong>Role:</strong> {invitationData.role?.replace('_', ' ')}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Password */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Create Password *
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                                placeholder="Enter password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeSlash size="20" /> : <Eye size="20" />}
                            </button>
                        </div>
                        <PasswordStrengthIndicator password={password} />
                    </div>

                    {/* Confirm Password */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Confirm Password *
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                                placeholder="Confirm password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showConfirmPassword ? <EyeSlash size="20" /> : <Eye size="20" />}
                            </button>
                        </div>
                        {confirmPassword && password !== confirmPassword && (
                            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={submitting || !password || !confirmPassword || password !== confirmPassword}
                        className="w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white py-3 rounded-lg hover:from-primary-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
                    >
                        {submitting ? 'Setting Password...' : 'Set Password & Continue'}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-xs text-slate-500 mt-6">
                    By setting your password, you agree to join {invitationData.organizationName}
                </p>
            </div>
        </div>
    );
};

export default SetPassword;
