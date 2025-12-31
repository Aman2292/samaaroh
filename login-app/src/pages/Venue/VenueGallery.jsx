import React, { useState, useEffect } from 'react';
import { Gallery, Add, Trash, Video, Document, CloudChange, TickCircle } from 'iconsax-react';
import { toast } from 'react-toastify';

const VenueGallery = ({ venueData, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [galleryImages, setGalleryImages] = useState([]);
    const [floorPlans, setFloorPlans] = useState([]);
    const [videoUrls, setVideoUrls] = useState([]);
    const [newVideoUrl, setNewVideoUrl] = useState('');
    const [newFloorPlanLabel, setNewFloorPlanLabel] = useState('');

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (venueData) {
            resetForm();
        }
    }, [venueData]);

    const resetForm = () => {
        setGalleryImages(venueData.galleryImages || []);
        setFloorPlans(venueData.floorPlans || []);
        setVideoUrls(venueData.videoUrls || []);
        setIsDirty(false);
    };

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Limit file size (e.g., 2MB per file) to avoid huge payloads
        const validFiles = files.filter(file => file.size <= 2 * 1024 * 1024);
        if (validFiles.length < files.length) {
            toast.warning('Some files were skipped because they exceed 2MB limit.');
        }

        try {
            const base64Images = await Promise.all(validFiles.map(file => convertToBase64(file)));
            setGalleryImages(prev => [...prev, ...base64Images]);
            setIsDirty(true);
        } catch (error) {
            toast.error('Error processing images');
        }
    };

    const handleFloorPlanUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error('File size exceeds 2MB limit.');
            return;
        }

        if (!newFloorPlanLabel.trim()) {
            toast.error('Please enter a label for the floor plan first.');
            return;
        }

        try {
            const base64 = await convertToBase64(file);
            setFloorPlans(prev => [...prev, { url: base64, label: newFloorPlanLabel }]);
            setNewFloorPlanLabel('');
            setIsDirty(true);
        } catch (error) {
            toast.error('Error processing floor plan');
        }
    };

    const handleAddVideo = () => {
        if (!newVideoUrl.trim()) return;
        // Basic URL validation
        try {
            new URL(newVideoUrl);
            setVideoUrls(prev => [...prev, newVideoUrl]);
            setNewVideoUrl('');
            setIsDirty(true);
        } catch (e) {
            toast.error('Please enter a valid URL');
        }
    };

    const handleDeleteImage = (index) => {
        setGalleryImages(prev => prev.filter((_, i) => i !== index));
        setIsDirty(true);
    };

    const handleDeleteFloorPlan = (index) => {
        setFloorPlans(prev => prev.filter((_, i) => i !== index));
        setIsDirty(true);
    };

    const handleDeleteVideo = (index) => {
        setVideoUrls(prev => prev.filter((_, i) => i !== index));
        setIsDirty(true);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const response = await fetch(`https://samaaroh-1.onrender.com/api/venue/${venueData._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({
                    galleryImages,
                    floorPlans,
                    videoUrls
                })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Gallery updated successfully');
                setIsDirty(false);
                onUpdate();
            } else {
                toast.error(data.error || 'Failed to update gallery');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const getEmbedUrl = (url) => {
        // Simple helper to convert YouTube/Vimeo watch URLs to embed URLs
        // This is a basic implementation
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = url.split('v=')[1] || url.split('/').pop();
            return `https://www.youtube.com/embed/${videoId.split('&')[0]}`;
        }
        if (url.includes('vimeo.com')) {
            const videoId = url.split('/').pop();
            return `https://player.vimeo.com/video/${videoId}`;
        }
        return url;
    };

    return (
        <div className="space-y-8">
            {/* Gallery Images */}
            <div className="bg-white p-6 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <Gallery size="20" color="#4f46e5" />
                        Photo Gallery
                    </h3>
                    <div className="relative">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <button className="flex items-center space-x-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors font-medium">
                            <Add size="20" color="#4f46e5" />
                            <span>Add Photos</span>
                        </button>
                    </div>
                </div>

                {galleryImages.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Gallery size="48" color="#cbd5e1" variant="Bulk" />
                        <p className="text-slate-500">No photos added yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {galleryImages.map((img, index) => (
                            <div key={index} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100">
                                <img src={img} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={() => handleDeleteImage(index)}
                                        className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-red-500 hover:text-white transition-colors"
                                    >
                                        <Trash size="20" color="#FFFFFF" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Floor Plans */}
            <div className="bg-white p-6 rounded-xl border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                    <Document size="20" color="#4f46e5" />
                    Floor Plans
                </h3>

                <div className="flex gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="Label (e.g., Ground Floor)"
                        value={newFloorPlanLabel}
                        onChange={(e) => setNewFloorPlanLabel(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFloorPlanUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={!newFloorPlanLabel.trim()}
                        />
                        <button
                            disabled={!newFloorPlanLabel.trim()}
                            className="flex items-center space-x-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Add size="20" color="#4f46e5" />
                            <span>Upload Plan</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {floorPlans.map((plan, index) => (
                        <div key={index} className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="aspect-video bg-slate-100 relative group">
                                <img src={plan.url} alt={plan.label} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={() => handleDeleteFloorPlan(index)}
                                        className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-red-500 hover:text-white transition-colors"
                                    >
                                        <Trash size="20" color="#FFFFFF" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-3 bg-slate-50 border-t border-slate-100">
                                <p className="font-medium text-slate-700 text-center">{plan.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Videos */}
            <div className="bg-white p-6 rounded-xl border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                    <Video size="20" color="#4f46e5" />
                    Videos
                </h3>

                <div className="flex gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="YouTube or Vimeo URL"
                        value={newVideoUrl}
                        onChange={(e) => setNewVideoUrl(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                        onClick={handleAddVideo}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors font-medium"
                    >
                        <Add size="20" color="#4f46e5" />
                        <span>Add Video</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {videoUrls.map((url, index) => (
                        <div key={index} className="rounded-xl overflow-hidden bg-slate-900 relative group">
                            <div className="aspect-video">
                                <iframe
                                    src={getEmbedUrl(url)}
                                    title={`Video ${index}`}
                                    className="w-full h-full"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                            <button
                                onClick={() => handleDeleteVideo(index)}
                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                                <Trash size="16" color="#FFFFFF" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Buttons */}
            {isDirty && (
                <div className="flex justify-end space-x-4 pt-4 animate-fadeIn">
                    <button
                        onClick={resetForm}
                        className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                    >
                        Discard Changes
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center space-x-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 shadow-lg shadow-primary-200"
                    >
                        {loading ? <CloudChange size="20" color="#FFFFFF" className="animate-bounce" /> : <TickCircle size="20" color="#FFFFFF" />}
                        <span>{loading ? 'Saving Changes...' : 'Save Changes'}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default VenueGallery;
