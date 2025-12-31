import React, { useState } from 'react';
import { CloseCircle, DocumentUpload } from 'iconsax-react';
import { toast } from 'react-toastify';

const BulkImportModal = ({ eventId, onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
                toast.error('Please upload an Excel file (.xlsx or .xls)');
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleDownloadTemplate = () => {
        // Create sample data
        const template = [
            ['First Name', 'Last Name', 'Email', 'Phone', 'Guest Type', 'Side', 'Plus One', 'Dietary Restrictions', 'Notes'],
            ['John', 'Doe', 'john@example.com', '9876543210', 'family', 'bride', 'Yes', 'vegetarian', 'Needs wheelchair access'],
            ['Jane', 'Smith', 'jane@example.com', '9876543211', 'friend', 'groom', 'No', '', '']
        ];

        // Convert to CSV
        const csv = template.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'guest-import-template.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Template downloaded');
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error('Please select a file');
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('eventId', eventId);

            const response = await fetch('https://samaaroh-1.onrender.com/api/guests/import-excel', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`${data.data.imported} guests imported successfully!`);
                onSuccess();
                onClose();
            } else {
                toast.error(data.error || 'Import failed');
            }
        } catch (error) {
            toast.error('Failed to upload file');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                <div className="border-b border-gray-200 p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Import Guests from Excel</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <CloseCircle size="28" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-4">
                            Upload an Excel file with guest information. Make sure your file has the following columns:
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <ul className="text-sm text-gray-700 space-y-1">
                                <li>• First Name (required)</li>
                                <li>• Last Name</li>
                                <li>• Email</li>
                                <li>• Phone</li>
                                <li>• Guest Type (family/friend/colleague/vip/vendor/other)</li>
                                <li>• Side (bride/groom/both/neutral)</li>
                                <li>• Plus One (Yes/No)</li>
                                <li>• Dietary Restrictions</li>
                                <li>• Notes</li>
                            </ul>
                        </div>
                    </div>

                    <button
                        onClick={handleDownloadTemplate}
                        className="w-full mb-6 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-primary-500 hover:text-primary-600"
                    >
                        Download Template
                    </button>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Excel File
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        {file && (
                            <p className="mt-2 text-sm text-gray-600">
                                Selected: {file.name}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={!file || loading}
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                            {loading ? 'Importing...' : 'Import Guests'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkImportModal;
