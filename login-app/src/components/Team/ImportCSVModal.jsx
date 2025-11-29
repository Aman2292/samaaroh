import React, { useState, useRef } from 'react';
import { CloseCircle, DocumentUpload, DocumentDownload, InfoCircle } from 'iconsax-react';
import { toast } from 'react-toastify';

const ImportCSVModal = ({ isOpen, onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [importResults, setImportResults] = useState(null);
    const fileInputRef = useRef(null);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'text/csv') {
            setFile(selectedFile);
            setImportResults(null);
        } else {
            toast.error('Please select a valid CSV file');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/team/csv-template', {
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'team-import-template.csv';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success('Template downloaded successfully');
            } else {
                toast.error('Failed to download template');
            }
        } catch (error) {
            console.error('Error downloading template:', error);
            toast.error('Failed to connect to server');
        }
    };

    const handleImport = async () => {
        if (!file) {
            toast.error('Please select a file to import');
            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('http://localhost:5001/api/team/import-csv', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                setImportResults(data.data);
                if (data.data.successful > 0) {
                    toast.success(`Successfully imported ${data.data.successful} team members`);
                    if (data.data.failed === 0) {
                        setTimeout(() => {
                            onSuccess?.();
                            handleClose();
                        }, 2000);
                    }
                } else {
                    toast.error('No team members were imported');
                }
            } else {
                toast.error(data.error || 'Failed to import CSV');
            }
        } catch (error) {
            console.error('Error importing CSV:', error);
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setImportResults(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800">Import Team Members</h2>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <CloseCircle size="24" className="text-slate-600" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Info Banner */}
                    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <InfoCircle size="20" className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">CSV Format Requirements:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Required columns: name, email, role</li>
                                <li>Optional columns: phone, designation</li>
                                <li>Valid roles: PLANNER, VENDOR, FINANCE</li>
                                <li>Download the template below for reference</li>
                            </ul>
                        </div>
                    </div>

                    {/* Download Template Button */}
                    <button
                        onClick={handleDownloadTemplate}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-primary-400 transition-colors"
                    >
                        <DocumentDownload size="20" />
                        <span>Download CSV Template</span>
                    </button>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Select CSV File
                        </label>
                        <div className="relative">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <DocumentUpload
                                size="20"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"
                            />
                        </div>
                        {file && (
                            <p className="mt-2 text-sm text-slate-600">
                                Selected: <span className="font-medium">{file.name}</span>
                            </p>
                        )}
                    </div>

                    {/* Import Results */}
                    {importResults && (
                        <div className="space-y-3">
                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-50 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-slate-800">{importResults.total}</p>
                                    <p className="text-xs text-slate-600">Total Rows</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-green-600">{importResults.successful}</p>
                                    <p className="text-xs text-green-700">Imported</p>
                                </div>
                                <div className="bg-red-50 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-red-600">{importResults.failed}</p>
                                    <p className="text-xs text-red-700">Failed</p>
                                </div>
                            </div>

                            {/* Errors */}
                            {importResults.errors && importResults.errors.length > 0 && (
                                <div className="border border-red-200 rounded-lg overflow-hidden">
                                    <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                                        <p className="text-sm font-medium text-red-800">Import Errors</p>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto">
                                        {importResults.errors.map((error, index) => (
                                            <div
                                                key={index}
                                                className="px-4 py-2 text-sm border-b border-red-100 last:border-0"
                                            >
                                                <span className="font-medium text-red-700">Row {error.row}:</span>
                                                <span className="text-red-600 ml-2">{error.email}</span>
                                                <p className="text-red-800 mt-1">{error.error}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Successfully Imported */}
                            {importResults.imported && importResults.imported.length > 0 && (
                                <div className="border border-green-200 rounded-lg overflow-hidden">
                                    <div className="bg-green-50 px-4 py-2 border-b border-green-200">
                                        <p className="text-sm font-medium text-green-800">Successfully Imported</p>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto">
                                        {importResults.imported.map((member, index) => (
                                            <div
                                                key={index}
                                                className="px-4 py-2 text-sm border-b border-green-100 last:border-0"
                                            >
                                                <span className="font-medium text-green-800">{member.name}</span>
                                                <span className="text-green-600 ml-2">({member.email})</span>
                                                <span className="text-green-700 ml-2 text-xs">{member.role}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            {importResults ? 'Close' : 'Cancel'}
                        </button>
                        {!importResults && (
                            <button
                                onClick={handleImport}
                                disabled={!file || loading}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Importing...' : 'Import CSV'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportCSVModal;
