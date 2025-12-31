import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { X, Upload, FileText } from 'lucide-react';

const UploadDocumentModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: 'other',
        entityType: 'event',
        entityId: '',
        description: '',
        file: null
    });
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [entities, setEntities] = useState([]);
    const [loadingEntities, setLoadingEntities] = useState(false);

    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // Fetch entities when entityType changes
    useEffect(() => {
        fetchEntities();
    }, [formData.entityType]);

    const fetchEntities = async () => {
        try {
            setLoadingEntities(true);
            let endpoint = '';

            switch (formData.entityType) {
                case 'event':
                    endpoint = 'https://samaaroh-1.onrender.com/api/events';
                    break;
                case 'client':
                    endpoint = 'https://samaaroh-1.onrender.com/api/clients';
                    break;
                case 'venue':
                    endpoint = 'https://samaaroh-1.onrender.com/api/venue';
                    break;
                default:
                    setEntities([]);
                    setLoadingEntities(false);
                    return;
            }

            const response = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();

            if (response.ok) {
                // Handle different response formats
                let items = [];
                if (formData.entityType === 'event') {
                    items = data.data || data.events || [];
                } else if (formData.entityType === 'client') {
                    items = data.docs || data.data || [];
                } else if (formData.entityType === 'venue') {
                    items = data.venues || data.data || [];
                }
                setEntities(items);
            } else {
                setEntities([]);
            }
        } catch (error) {
            console.error('Error fetching entities:', error);
            setEntities([]);
        } finally {
            setLoadingEntities(false);
        }
    };

    const getEntityDisplayName = (entity) => {
        if (!entity) return '';
        if (formData.entityType === 'event') {
            return entity.eventName || entity.name || 'Unnamed Event';
        } else if (formData.entityType === 'client') {
            return entity.name || 'Unnamed Client';
        } else if (formData.entityType === 'venue') {
            return entity.category || 'Unnamed Venue';
        }
        return 'Unknown';
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file) => {
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg', 'image/png', 'image/jpg', 'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

        if (!allowedTypes.includes(file.type)) {
            toast.error('Invalid file type. Please upload PDF, DOC, images, or Excel files.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

        setFormData({ ...formData, file, name: formData.name || file.name });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.file) {
            toast.error('Please select a file');
            return;
        }

        if (!formData.entityId) {
            toast.error('Please select an entity');
            return;
        }

        try {
            setUploading(true);

            const uploadFormData = new FormData();
            uploadFormData.append('file', formData.file);
            uploadFormData.append('name', formData.name);
            uploadFormData.append('category', formData.category);
            uploadFormData.append('entityType', formData.entityType);
            uploadFormData.append('entityId', formData.entityId);
            if (formData.description) uploadFormData.append('description', formData.description);

            const response = await fetch('https://samaaroh-1.onrender.com/api/documents', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: uploadFormData
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Document uploaded successfully');
                onSuccess();
            } else {
                toast.error(data.error || 'Failed to upload document');
            }
        } catch (error) {
            toast.error('Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Upload Document</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        {formData.file ? (
                            <div className="space-y-2">
                                <FileText className="mx-auto text-blue-600" size={48} />
                                <p className="text-sm font-medium text-gray-900">{formData.file.name}</p>
                                <p className="text-xs text-gray-500">{(formData.file.size / 1024).toFixed(2)} KB</p>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, file: null })}
                                    className="text-sm text-red-600 hover:text-red-700"
                                >
                                    Remove file
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Upload className="mx-auto text-gray-400" size={48} />
                                <p className="text-sm text-gray-600">
                                    Drag and drop your file here, or{' '}
                                    <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                                        browse
                                        <input type="file" className="hidden" onChange={handleFileInput} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx" />
                                    </label>
                                </p>
                                <p className="text-xs text-gray-500">PDF, DOC, Images, Excel (Max 10MB)</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Document Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="contract">Contract</option>
                            <option value="permit">Permit</option>
                            <option value="insurance">Insurance</option>
                            <option value="floor_plan">Floor Plan</option>
                            <option value="mood_board">Mood Board</option>
                            <option value="quote">Quote</option>
                            <option value="receipt">Receipt</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Link To *</label>
                            <select
                                value={formData.entityType}
                                onChange={(e) => setFormData({ ...formData, entityType: e.target.value, entityId: '' })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="event">Event</option>
                                <option value="client">Client</option>
                                <option value="venue">Venue</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select {formData.entityType.charAt(0).toUpperCase() + formData.entityType.slice(1)} *
                            </label>
                            <select
                                value={formData.entityId}
                                onChange={(e) => setFormData({ ...formData, entityId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={loadingEntities}
                            >
                                <option value="">{loadingEntities ? 'Loading...' : `Select ${formData.entityType}`}</option>
                                {entities.map((entity) => (
                                    <option key={entity._id} value={entity._id}>
                                        {getEntityDisplayName(entity)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Optional description..."
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? 'Uploading...' : 'Upload Document'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadDocumentModal;
