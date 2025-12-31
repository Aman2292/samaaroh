import { X, Download, Calendar, User, Tag } from 'lucide-react';

const DocumentPreviewModal = ({ document, onClose }) => {
    const isPDF = document.mimeType === 'application/pdf';
    const isImage = document.mimeType?.startsWith('image/');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900">{document.name}</h2>
                        <p className="text-sm text-gray-600 mt-1">{document.category?.replace('_', ' ')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <a
                            href={`https://samaaroh-1.onrender.com${document.fileUrl}`}
                            download
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Download size={18} />
                            Download
                        </a>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex">
                    {/* Preview Area */}
                    <div className="flex-1 bg-gray-100 p-4 overflow-auto">
                        {isPDF ? (
                            <iframe
                                src={`https://samaaroh-1.onrender.com${document.fileUrl}`}
                                className="w-full h-full border-0 rounded-lg bg-white"
                                title={document.name}
                            />
                        ) : isImage ? (
                            <div className="flex items-center justify-center h-full">
                                <img
                                    src={`https://samaaroh-1.onrender.com${document.fileUrl}`}
                                    alt={document.name}
                                    className="max-w-full max-h-full object-contain rounded-lg"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                                    <a
                                        href={`https://samaaroh-1.onrender.com${document.fileUrl}`}
                                        download
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Download size={18} />
                                        Download to view
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Metadata Sidebar */}
                    <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-auto">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Details</h3>

                        <div className="space-y-4">
                            {/* Uploaded By */}
                            <div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                    <User size={16} />
                                    <span>Uploaded By</span>
                                </div>
                                <p className="text-sm font-medium text-gray-900 ml-6">
                                    {document.uploadedBy?.name || 'Unknown'}
                                </p>
                            </div>

                            {/* Upload Date */}
                            <div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                    <Calendar size={16} />
                                    <span>Uploaded</span>
                                </div>
                                <p className="text-sm font-medium text-gray-900 ml-6">
                                    {new Date(document.uploadedAt).toLocaleString()}
                                </p>
                            </div>

                            {/* Size */}
                            <div>
                                <div className="text-sm text-gray-600 mb-1">File Size</div>
                                <p className="text-sm font-medium text-gray-900">
                                    {document.fileSize ? `${(document.fileSize / 1024).toFixed(2)} KB` : 'N/A'}
                                </p>
                            </div>

                            {/* Category */}
                            <div>
                                <div className="text-sm text-gray-600 mb-1">Category</div>
                                <p className="text-sm font-medium text-gray-900 capitalize">
                                    {document.category?.replace('_', ' ')}
                                </p>
                            </div>

                            {/* Entity Type */}
                            <div>
                                <div className="text-sm text-gray-600 mb-1">Related To</div>
                                <p className="text-sm font-medium text-gray-900 capitalize">
                                    {document.entityType}
                                </p>
                            </div>

                            {/* Invoice Metadata */}
                            {document.invoiceMetadata && (
                                <div className="pt-4 border-t border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Invoice Details</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Invoice #</span>
                                            <span className="font-medium text-blue-600">
                                                {document.invoiceMetadata.invoiceNumber}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Amount</span>
                                            <span className="font-medium">
                                                ₹{document.invoiceMetadata.amount?.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Status</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${document.invoiceMetadata.status === 'paid'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {document.invoiceMetadata.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tags */}
                            {document.tags && document.tags.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                        <Tag size={16} />
                                        <span>Tags</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 ml-6">
                                        {document.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            {document.description && (
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Description</div>
                                    <p className="text-sm text-gray-900">{document.description}</p>
                                </div>
                            )}

                            {/* Version Info */}
                            {document.version > 1 && (
                                <div className="pt-4 border-t border-gray-200">
                                    <div className="text-sm text-gray-600 mb-1">Version</div>
                                    <p className="text-sm font-medium text-gray-900">
                                        v{document.version}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentPreviewModal;
