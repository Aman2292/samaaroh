import React from 'react';
import { Trash, CloseCircle, Warning2 } from 'iconsax-react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, loading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Warning2 size="32" className="text-red-600" variant="Bold" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                        {title || 'Delete Confirmation'}
                    </h3>

                    <p className="text-slate-600 mb-6">
                        {message || 'Are you sure you want to delete this item? This action cannot be undone.'}
                    </p>

                    <div className="flex space-x-3 justify-center">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center"
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash size="20" className="mr-2" />
                                    Delete
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
