import React from 'react';
import { CloseCircle, DocumentDownload } from 'iconsax-react';

const QRCodeModal = ({ guest, onClose }) => {
    const handleDownload = () => {
        if (guest.qrCodeImage) {
            const link = document.createElement('a');
            link.href = guest.qrCodeImage;
            link.download = `${guest.firstName}_${guest.lastName}_QR.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Guest QR Code</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <CloseCircle size="24" />
                    </button>
                </div>

                {/* Guest Info */}
                <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {guest.firstName} {guest.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {guest.phone || guest.email || 'No contact info'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Expected: {guest.expectedHeadcount || 1} guest(s)
                    </p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center mb-6">
                    {guest.qrCodeImage ? (
                        <img
                            src={guest.qrCodeImage}
                            alt="QR Code"
                            className="w-64 h-64 border rounded-lg shadow-sm"
                        />
                    ) : (
                        <div className="w-64 h-64 bg-gray-100 flex items-center justify-center rounded-lg">
                            <span className="text-gray-400">QR not generated</span>
                        </div>
                    )}
                </div>

                {/* QR Code Text */}
                <div className="text-center mb-6">
                    <code className="text-xs bg-gray-100 px-3 py-1 rounded font-mono">
                        {guest.qrCode || 'Not generated'}
                    </code>
                </div>

                {/* Check-in Status */}
                <div className="text-center mb-6">
                    {guest.checkedIn ? (
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            ✓ Checked In ({guest.actualHeadcount || 0} guests)
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                            Not Checked In Yet
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                        Close
                    </button>
                    {guest.qrCodeImage && (
                        <button
                            onClick={handleDownload}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                            <DocumentDownload size="18" />
                            Download
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QRCodeModal;
