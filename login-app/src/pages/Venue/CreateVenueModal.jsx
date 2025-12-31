import React, { useState, useEffect } from 'react';
import { CloseCircle, Building, Location, TickCircle, ArrowRight, Verify } from 'iconsax-react';
import { toast } from 'react-toastify';

const CreateVenueModal = ({ isOpen, onClose, onSuccess }) => {
    const [activeStep, setActiveStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [completedSteps, setCompletedSteps] = useState([]);
    const [formData, setFormData] = useState({
        category: 'venue',
        description: '',
        address: {
            street: '',
            city: '',
            state: '',
            zip: '',
            googleMapsUrl: ''
        },
        amenities: [],
        policies: {
            cancellation: '',
            refund: '',
            outsideCatering: false
        }
    });

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    // Debounce map update
    const [debouncedAddress, setDebouncedAddress] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            const { street, city, state, zip } = formData.address;
            if (street || city) {
                setDebouncedAddress(`${street}, ${city}, ${state}, ${zip}`);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [formData.address]);

    // Calculate progress
    const totalSteps = 3;
    const progress = Math.round(((activeStep - 1) / totalSteps) * 100);

    const steps = [
        { id: 1, label: 'Basic Details', icon: Building, description: 'Category & Description' },
        { id: 2, label: 'Location', icon: Location, description: 'Address & Map' },
        { id: 3, label: 'Amenities & Policies', icon: TickCircle, description: 'Features & Rules' }
    ];

    const validateStep = (step) => {
        switch (step) {
            case 1:
                return formData.category && formData.description.trim().length > 0;
            case 2:
                return formData.address.street && formData.address.city && formData.address.state && formData.address.zip;
            case 3:
                return true; // Optional fields
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (validateStep(activeStep)) {
            if (!completedSteps.includes(activeStep)) {
                setCompletedSteps([...completedSteps, activeStep]);
            }
            setActiveStep(prev => Math.min(prev + 1, 3));
        } else {
            toast.error('Please fill in all required fields');
        }
    };

    const handleStepClick = (stepId) => {
        // Can only go to previous steps or next step if current is completed
        if (stepId < activeStep || (stepId === activeStep + 1 && completedSteps.includes(activeStep))) {
            setActiveStep(stepId);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handlePolicyChange = (e) => {
        const { name, value, type, checked } = e.target;
        const field = name.split('.')[1];
        setFormData(prev => ({
            ...prev,
            policies: {
                ...prev.policies,
                [field]: type === 'checkbox' ? checked : value
            }
        }));
    };

    const handleAmenityChange = (amenity) => {
        setFormData(prev => {
            const amenities = prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity];
            return { ...prev, amenities };
        });
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://samaaroh-1.onrender.com/api/venue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Venue created successfully!');
                onSuccess();
                onClose();
            } else {
                toast.error(data.error || 'Failed to create venue');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const commonAmenities = ['AC', 'Parking', 'Stage', 'Sound System', 'Projector', 'Wi-Fi', 'Changing Rooms', 'Power Backup'];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex overflow-hidden max-h-[90vh]">

                {/* Left Sidebar - Stepper */}
                <div className="w-1/3 bg-slate-50 border-r border-slate-100 p-6 flex flex-col">
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800">Setup Venue</h2>
                        <div className="mt-4 flex items-center space-x-2">
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary-600 transition-all duration-500"
                                    style={{ width: `${((completedSteps.length) / 3) * 100}%` }}
                                />
                            </div>
                            <span className="text-xs font-medium text-slate-600">{Math.round(((completedSteps.length) / 3) * 100)}%</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {steps.map((step) => {
                            const Icon = step.icon;
                            const isActive = activeStep === step.id;
                            const isCompleted = completedSteps.includes(step.id);
                            const isLocked = !isCompleted && step.id > activeStep;

                            return (
                                <button
                                    key={step.id}
                                    onClick={() => !isLocked && handleStepClick(step.id)}
                                    disabled={isLocked}
                                    className={`w-full flex items-center p-3 rounded-xl transition-all text-left ${isActive
                                        ? 'bg-white shadow-md border border-primary-100 ring-1 ring-primary-500/20'
                                        : isLocked
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:bg-white hover:shadow-sm'
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg mr-3 ${isActive ? 'bg-primary-600 text-white' :
                                        isCompleted ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
                                        }`}>
                                        {isCompleted && !isActive ? <Verify size="20" color="#FFFFFF" /> : <Icon size="20" color={isActive || isCompleted ? "#FFFFFF" : "#64748b"} />}
                                    </div>
                                    <div>
                                        <p className={`font-medium ${isActive ? 'text-primary-900' : 'text-slate-700'}`}>{step.label}</p>
                                        <p className="text-xs text-slate-500">{step.description}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Content - Form */}
                <div className="flex-1 flex flex-col bg-white">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-slate-800">{steps[activeStep - 1].label}</h3>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <CloseCircle size="24" color="#94a3b8" className="hover:text-slate-600" />
                        </button>
                    </div>

                    <div className="p-8 overflow-y-auto flex-1">
                        {activeStep === 1 && (
                            <div className="space-y-6 animate-fadeIn">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Venue Category <span className="text-red-500">*</span></label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                                    >
                                        <option value="venue">Wedding Venue</option>
                                        <option value="banquet">Banquet Hall</option>
                                        <option value="resort">Resort</option>
                                        <option value="hotel">Hotel</option>
                                        <option value="lawn">Lawn/Farmhouse</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Description <span className="text-red-500">*</span></label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows="6"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="Tell us about your venue..."
                                    />
                                </div>
                            </div>
                        )}

                        {activeStep === 2 && (
                            <div className="space-y-6 animate-fadeIn">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Street Address <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="address.street"
                                        value={formData.address.street}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="123 Main St"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">City <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="address.city"
                                            value={formData.address.city}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">State <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="address.state"
                                            value={formData.address.state}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">ZIP Code <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="address.zip"
                                            value={formData.address.zip}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        name="address.googleMapsUrl"
                                        value={formData.address.googleMapsUrl}
                                        onChange={handleChange}
                                        placeholder="https://maps.google.com/..."
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                                {(formData.address.street || formData.address.city) && (
                                    <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 h-64">
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            frameBorder="0"
                                            scrolling="no"
                                            marginHeight="0"
                                            marginWidth="0"
                                            src={`https://maps.google.com/maps?q=${encodeURIComponent(debouncedAddress)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                                            title="Venue Location"
                                        ></iframe>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeStep === 3 && (
                            <div className="space-y-8 animate-fadeIn">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-3">Amenities</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {commonAmenities.map(amenity => (
                                            <label key={amenity} className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${formData.amenities.includes(amenity)
                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                : 'border-slate-200 hover:border-slate-300'
                                                }`}>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.amenities.includes(amenity)}
                                                    onChange={() => handleAmenityChange(amenity)}
                                                    className="rounded text-primary-600 focus:ring-primary-500 mr-3"
                                                />
                                                <span className="font-medium">{amenity}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Cancellation Policy</label>
                                        <textarea
                                            name="policies.cancellation"
                                            value={formData.policies.cancellation}
                                            onChange={handlePolicyChange}
                                            rows="3"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            placeholder="e.g. Full refund if cancelled 30 days prior..."
                                        />
                                    </div>
                                    <label className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="policies.outsideCatering"
                                            checked={formData.policies.outsideCatering}
                                            onChange={handlePolicyChange}
                                            className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-slate-700 font-medium">Allow Outside Catering</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-slate-100 flex justify-between bg-white">
                        <button
                            onClick={() => setActiveStep(prev => Math.max(prev - 1, 1))}
                            disabled={activeStep === 1}
                            className={`px-6 py-2.5 rounded-xl font-medium transition-colors ${activeStep === 1
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            Back
                        </button>

                        {activeStep < 3 ? (
                            <button
                                onClick={handleNext}
                                className="flex items-center space-x-2 px-8 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium shadow-lg shadow-primary-200"
                            >
                                <span>Next</span>
                                <ArrowRight size="20" color="#FFFFFF" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center space-x-2 px-8 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium shadow-lg shadow-green-200 disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Complete Setup'}
                                {!loading && <TickCircle size="20" color="#FFFFFF" />}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default CreateVenueModal;
