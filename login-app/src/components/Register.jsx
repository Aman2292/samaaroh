import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeSlash, Sms, User, Building, Call, Location, ArrowLeft, ArrowRight } from 'iconsax-react';
import PrimaryButton from './common/PrimaryButton';
import TertiaryButton from './common/TertiaryButton';
import registerBg from '../assets/register-bg.png';

const Register = ({ onLogin, onNavigate }) => {
    // ... state ...
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        organizationName: '',
        city: '',
        role: 'PLANNER_OWNER'
    });

    const testimonials = [
        {
            text: "Samaaroh has completely transformed how we manage our wedding planning business. The efficiency we've gained is incredible.",
            name: "Jane Doe",
            role: "Top Wedding Planner, Mumbai",
            initials: "JD"
        },
        {
            text: "The best platform for connecting with clients. My venue bookings have doubled since I started using Samaaroh.",
            name: "Rajesh Kumar",
            role: "Venue Owner, Delhi",
            initials: "RK"
        },
        {
            text: "Managing guest lists and vendor payments used to be a nightmare. Samaaroh made it a breeze!",
            name: "Priya Kapoor",
            role: "Event Coordinator, Bangalore",
            initials: "PK"
        }
    ];

    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const nextTestimonial = () => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    };

    const prevTestimonial = () => {
        setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5001/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
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
        <div className="min-h-screen flex w-full bg-gradient-to-br from-purple-200 via-purple-50 to-purple-200">
            {/* Left Side - Form */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center overflow-y-auto">
                <div className="max-w-md mx-auto w-full">
                    <div className="mb-8">
                        <h3 className="text-3xl font-bold text-slate-900">Partner with Samaaroh</h3>
                        <p className="text-slate-500 mt-2">Create your business account today.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Full Name" name="name" value={formData.name} onChange={handleChange} Icon={User} placeholder="John Doe" />
                            <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} Icon={Sms} placeholder="user@example.com" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock size="20" color="#64748b" className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" variant="Outline" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10"
                                >
                                    {showPassword ? <EyeSlash size="20" color="#64748b" variant="Outline" /> : <Eye size="20" color="#64748b" variant="Outline" />}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Phone" name="phone" value={formData.phone} onChange={handleChange} Icon={Call} placeholder="+91 98765 43210" />
                            <InputField label="City" name="city" value={formData.city} onChange={handleChange} Icon={Location} placeholder="Mumbai" />
                        </div>

                        <InputField label="Business Name" name="organizationName" value={formData.organizationName} onChange={handleChange} Icon={Building} placeholder="Dream Weddings Ltd." />

                        {error && (
                            <div className="text-red-500 text-sm text-center bg-red-50 py-3 rounded-xl font-medium">
                                {error}
                            </div>
                        )}

                        <PrimaryButton type="submit" disabled={loading} fullWidth className="!py-3 !text-base !rounded-xl mt-4">
                            {loading ? 'Registering...' : 'Create Account'}
                        </PrimaryButton>
                    </form>

                    <div className="mt-8 text-center">
                        <span className="text-slate-500">
                            Already have an account?{' '}
                            <TertiaryButton onClick={() => onNavigate('login')} className="!px-1 !py-0 !inline-flex !font-semibold !text-[#7F5EFF] hover:!bg-transparent hover:!underline">
                                Sign in
                            </TertiaryButton>
                        </span>
                    </div>
                </div >
            </div >

            {/* Right Side - Image */}
            < div className="hidden md:block w-1/2 p-4 sticky top-0 h-screen relative" >
                <div className="relative w-full h-full rounded-[2rem] overflow-hidden">

                    {/* Back Button (Top Left of Image) */}
                    <button
                        onClick={() => onNavigate('home')}
                        className="absolute top-6 left-6 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-white hover:bg-black/40 transition-all cursor-pointer"
                    >
                        <ArrowLeft size="24" color="#ffffff" />
                    </button>

                    <img
                        src={registerBg}
                        alt="Wedding Inspiration"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

                    <div className="absolute bottom-12 left-12 right-12 z-20">
                        {/* Navigation Buttons - Moved Above */}
                        <div className="flex justify-end gap-3 mb-4">
                            <button
                                onClick={prevTestimonial}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all active:scale-95"
                            >
                                <ArrowLeft size="20" color="#ffffff" />
                            </button>
                            <button
                                onClick={nextTestimonial}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all active:scale-95"
                            >
                                <ArrowRight size="20" color="#ffffff" />
                            </button>
                        </div>

                        <div
                            key={currentTestimonial}
                            className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl text-white relative animate-[fadeIn_0.5s_ease-out]"
                        >
                            <p className="text-xl font-medium leading-relaxed mb-6 min-h-[84px]">
                                "{testimonials[currentTestimonial].text}"
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold shrink-0">
                                    {testimonials[currentTestimonial].initials}
                                </div>
                                <div>
                                    <p className="font-semibold text-white">{testimonials[currentTestimonial].name}</p>
                                    <p className="text-sm text-white/70">{testimonials[currentTestimonial].role}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
};

const InputField = ({ label, name, value, onChange, Icon, placeholder, type = "text" }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
        <div className="relative">
            <Icon size="20" color="#64748b" className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" variant="Outline" />
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all"
                placeholder={placeholder}
                required
            />
        </div>
    </div>
);

export default Register;