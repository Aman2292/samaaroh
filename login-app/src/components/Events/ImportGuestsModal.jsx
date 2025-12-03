import React, { useState, useRef } from 'react';
import { CloseCircle, DocumentUpload, DocumentDownload, TickCircle, Danger } from 'iconsax-react';
import { toast } from 'react-toastify';
import Papa from 'papaparse';

const ImportGuestsModal = ({ eventId, isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState(1); // 1: Upload, 2: Preview & Validate
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [validationErrors, setValidationErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    if (!isOpen) return null;

    const handleDownloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + "name,phone,email,side,group,headcount,rsvpStatus,dietaryRestrictions,specialNotes\n"
            + "John Doe,1234567890,john@example.com,groom,friends,2,confirmed,None,Likes window seat\n"
            + "Jane Smith,0987654321,jane@example.com,bride,family,1,invited,Vegetarian,";

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "guest_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
                toast.error('Please upload a valid CSV file');
                return;
            }
            setFile(selectedFile);
            parseCSV(selectedFile);
        }
    };

    const parseCSV = (file) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data;
                validateData(data);
                setParsedData(data);
                setStep(2);
            },
            error: (error) => {
                toast.error('Error parsing CSV file: ' + error.message);
            }
        });
    };

    const validateData = (data) => {
        const errors = [];
        data.forEach((row, index) => {
            const rowErrors = [];
            if (!row.name) rowErrors.push('Name is required');
            if (!row.side) rowErrors.push('Side is required');
            if (row.headcount && isNaN(parseInt(row.headcount))) rowErrors.push('Headcount must be a number');

            if (rowErrors.length > 0) {
                errors.push({ row: index + 1, errors: rowErrors });
            }
        });
        setValidationErrors(errors);
    };

    const handleImport = async () => {
        if (validationErrors.length > 0) {
            toast.error('Please fix validation errors in the CSV file before importing.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5001/api/events/${eventId}/guests/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ guests: parsedData })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`Successfully imported ${data.count} guests!`);
                onSuccess();
                handleClose();
            } else {
                toast.error(data.error || 'Failed to import guests');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setFile(null);
        setParsedData([]);
        setValidationErrors([]);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-t-xl flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold">Import Guests</h2>
                        <p className="text-sm text-green-100 mt-1">Upload CSV to bulk add guests</p>
                    </div>
                    <button onClick={handleClose} className="text-white hover:text-green-100 transition-colors">
                        <CloseCircle size="28" color="#ffffff" variant="Outline" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-grow">
                    {step === 1 ? (
                        <div className="space-y-6">
                            {/* Template Download */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-slate-900">Step 1: Download Template</h3>
                                    <p className="text-sm text-slate-500">Use our CSV template to ensure correct formatting.</p>
                                </div>
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    <DocumentDownload size="20" color="#334155" variant="Outline" />
                                    <span>Download CSV</span>
                                </button>
                            </div>

                            {/* File Upload */}
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-green-500 transition-colors bg-slate-50">
                                <div className="flex flex-col items-center justify-center space-y-4">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                        <DocumentUpload size="32" color="#16a34a" variant="Outline" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-slate-900">Click to upload CSV</h3>
                                        <p className="text-sm text-slate-500 mt-1">or drag and drop file here</p>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".csv"
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current.click()}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        Select File
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium text-slate-900">Preview & Validate ({parsedData.length} guests)</h3>
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-sm text-slate-500 hover:text-slate-700"
                                >
                                    Change File
                                </button>
                            </div>

                            {/* Validation Summary */}
                            {validationErrors.length > 0 ? (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="flex items-start space-x-3">
                                        <Danger size="24" color="#dc2626" variant="Bold" className="shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-red-800">Validation Errors Found</h4>
                                            <p className="text-sm text-red-600 mt-1">Please fix the following issues in your CSV file:</p>
                                            <ul className="mt-2 text-sm text-red-600 list-disc list-inside max-h-32 overflow-y-auto">
                                                {validationErrors.map((err, idx) => (
                                                    <li key={idx}>Row {err.row}: {err.errors.join(', ')}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
                                    <TickCircle size="24" color="#16a34a" variant="Bold" />
                                    <span className="text-green-800 font-medium">All data looks good! Ready to import.</span>
                                </div>
                            )}

                            {/* Preview Table */}
                            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2">Name</th>
                                            <th className="px-4 py-2">Phone</th>
                                            <th className="px-4 py-2">Side</th>
                                            <th className="px-4 py-2">Group</th>
                                            <th className="px-4 py-2">Headcount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {parsedData.slice(0, 10).map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-4 py-2">{row.name}</td>
                                                <td className="px-4 py-2">{row.phone}</td>
                                                <td className="px-4 py-2 capitalize">{row.side}</td>
                                                <td className="px-4 py-2 capitalize">{row.group}</td>
                                                <td className="px-4 py-2">{row.headcount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {parsedData.length > 10 && (
                                    <div className="px-4 py-2 bg-slate-50 text-center text-xs text-slate-500 border-t border-slate-200">
                                        Showing first 10 of {parsedData.length} rows
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 flex justify-end space-x-3 shrink-0">
                    <button
                        onClick={handleClose}
                        className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    {step === 2 && (
                        <button
                            onClick={handleImport}
                            disabled={loading || validationErrors.length > 0}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {loading ? (
                                <span>Importing...</span>
                            ) : (
                                <>
                                    <DocumentUpload size="20" color="#ffffff" variant="Outline" />
                                    <span>Import Guests</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportGuestsModal;
