
import React, { useState } from 'react';
import { Lock, Eye, EyeSlash, Sms } from 'iconsax-react';

const Login = ({ onLogin, onNavigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5001/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('userInfo', JSON.stringify(data));
                onLogin();
            } else {
                setError(data.message || 'Something went wrong');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl flex overflow-hidden max-w-4xl w-full">
                {/* Left Side - Decorative */}
                <div className="hidden md:block w-1/2 bg-gradient-to-br from-primary-600 to-primary-700 p-12 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-2">
                            Welcome Back
                        </h2>
                        <p className="text-primary-100">
                            Sign in to access your dashboard and manage your events.
                        </p>
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm opacity-80">© 2024 Samaaroh Inc.</p>
                    </div>
                    {/* Abstract circles */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-white mix-blend-overlay blur-3xl"></div>
                        <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-white mix-blend-overlay blur-3xl"></div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-slate-800">
                            Sign In
                        </h3>
                        <p className="text-slate-500 mt-2">Please enter your details</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                            <div className="relative">
                                <Sms size="20" color="#000" variant="Outline" className="absolute left-3 top-1/2 -translate-y-1/2 z-10" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                                    placeholder="user@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                            <div className="relative">
                                <Lock size="20" color="#000" variant="Outline" className="absolute left-3 top-1/2 -translate-y-1/2 z-10" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-12 py-3 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-black hover:text-slate-700"
                                >
                                    {showPassword ? <EyeSlash size="20" color="#000" variant="Outline" /> : <Eye size="20" color="#000" variant="Outline" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center text-slate-600 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 mr-2" />
                                Remember me
                            </label>
                            <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">Forgot password?</a>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition-all transform active:scale-[0.98] flex items-center justify-center"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 space-y-4">
                        <div className="text-center text-sm text-slate-500">
                            Don't have an account?{' '}
                            <button onClick={() => onNavigate('register')} className="text-primary-600 font-medium hover:underline">
                                Sign up
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

