import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Upload, FileText, Filter, Search, Eye, Trash2, Share2, Download, Plus, Calendar } from 'lucide-react';
import UploadDocumentModal from '../../components/Documents/UploadDocumentModal';
import DocumentPreviewModal from '../../components/Documents/DocumentPreviewModal';

const DocumentsList = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [filters, setFilters] = useState({
        category: '',
        search: '',
        entityType: ''
    });

    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const navigate = useNavigate();

    useEffect(() => {
        fetchDocuments();
    }, [filters]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                ...(filters.category && { category: filters.category }),
                ...(filters.search && { search: filters.search }),
                ...(filters.entityType && { entityType: filters.entityType })
            });

            const response = await fetch(`https://samaaroh-1.onrender.com/api/documents?${params}`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setDocuments(data.data || []);
            } else {
                toast.error(data.error || 'Failed to fetch documents');
            }
        } catch (error) {
            toast.error('Failed to fetch documents');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;

        try {
            const response = await fetch(`https://samaaroh-1.onrender.com/api/documents/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            if (response.ok) {
                toast.success('Document deleted successfully');
                fetchDocuments();
            } else {
                toast.error('Failed to delete document');
            }
        } catch (error) {
            toast.error('Failed to delete document');
        }
    };

    const handlePreview = (doc) => {
        setSelectedDocument(doc);
        setShowPreviewModal(true);
    };

    const getCategoryIcon = (category) => {
        const icons = {
            invoice: '📄',
            contract: '📝',
            permit: '📋',
            insurance: '🛡️',
            floor_plan: '🏗️',
            mood_board: '🎨',
            quote: '💰',
            receipt: '🧾',
            other: '📁'
        };
        return icons[category] || '📁';
    };

    const getCategoryColor = (category) => {
        const colors = {
            invoice: 'bg-blue-100 text-blue-700',
            contract: 'bg-purple-100 text-purple-700',
            permit: 'bg-green-100 text-green-700',
            insurance: 'bg-yellow-100 text-yellow-700',
            floor_plan: 'bg-indigo-100 text-indigo-700',
            mood_board: 'bg-pink-100 text-pink-700',
            quote: 'bg-orange-100 text-orange-700',
            receipt: 'bg-teal-100 text-teal-700',
            other: 'bg-gray-100 text-gray-700'
        };
        return colors[category] || 'bg-gray-100 text-gray-700';
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        const mb = bytes / (1024 * 1024);
        return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(2)} MB`;
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
                    <p className="text-gray-600 mt-1">Manage all your event documents in one place</p>
                </div>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    Upload Document
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search documents..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Category Filter */}
                    <select
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Categories</option>
                        <option value="invoice">Invoices</option>
                        <option value="contract">Contracts</option>
                        <option value="permit">Permits</option>
                        <option value="insurance">Insurance</option>
                        <option value="floor_plan">Floor Plans</option>
                        <option value="mood_board">Mood Boards</option>
                        <option value="quote">Quotes</option>
                        <option value="receipt">Receipts</option>
                        <option value="other">Other</option>
                    </select>

                    {/* Entity Type Filter */}
                    <select
                        value={filters.entityType}
                        onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Types</option>
                        <option value="event">Events</option>
                        <option value="client">Clients</option>
                        <option value="venue">Venues</option>
                        <option value="vendor">Vendors</option>
                        <option value="invoice">Invoices</option>
                    </select>
                </div>
            </div>

            {/* Documents Grid */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : documents.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <FileText className="mx-auto text-gray-400 mb-4" size={64} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                    <p className="text-gray-600 mb-4">Upload your first document to get started</p>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        <Upload size={20} />
                        Upload Document
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documents.map((doc) => (
                        <div
                            key={doc._id}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6"
                        >
                            {/* Document Icon & Category */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="text-4xl">{getCategoryIcon(doc.category)}</div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 line-clamp-2">{doc.name}</h3>
                                        <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(doc.category)}`}>
                                            {doc.category.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                <div className="flex justify-between">
                                    <span>Size:</span>
                                    <span className="font-medium">{formatFileSize(doc.fileSize)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Uploaded:</span>
                                    <span className="font-medium">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                </div>
                                {doc.invoiceMetadata && (
                                    <div className="flex justify-between">
                                        <span>Invoice:</span>
                                        <span className="font-medium text-blue-600">{doc.invoiceMetadata.invoiceNumber}</span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => handlePreview(doc)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Eye size={16} />
                                    View
                                </button>
                                <a
                                    href={`https://samaaroh-1.onrender.com${doc.fileUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                >
                                    <Download size={16} />
                                </a>
                                <button
                                    onClick={() => handleDelete(doc._id)}
                                    className="flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            {showUploadModal && (
                <UploadDocumentModal
                    onClose={() => setShowUploadModal(false)}
                    onSuccess={() => {
                        setShowUploadModal(false);
                        fetchDocuments();
                    }}
                />
            )}

            {showPreviewModal && selectedDocument && (
                <DocumentPreviewModal
                    document={selectedDocument}
                    onClose={() => {
                        setShowPreviewModal(false);
                        setSelectedDocument(null);
                    }}
                />
            )}
        </div>
    );
};

export default DocumentsList;
