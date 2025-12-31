import React, { useState, useEffect } from 'react';
import { CloseCircle, DocumentDownload, Sms, Printer, Edit2, Trash, TickCircle } from 'iconsax-react';
import { toast } from 'react-toastify';

const InvoiceDetailSidebar = ({ invoiceId, isOpen, onClose, onUpdate }) => {
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [showEmailDialog, setShowEmailDialog] = useState(false);
    const [emailAddress, setEmailAddress] = useState('');

    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    useEffect(() => {
        if (isOpen && invoiceId) {
            fetchInvoiceDetails();
        }
    }, [isOpen, invoiceId]);

    const fetchInvoiceDetails = async () => {
        setLoading(true);
        try {
            const response = await fetch(`https://samaaroh-1.onrender.com/api/invoices/${invoiceId}`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setInvoice(data.data);
                setEmailAddress(data.data.clientId?.email || '');
            } else {
                toast.error(data.error || 'Failed to fetch invoice');
            }
        } catch (error) {
            console.error('Error fetching invoice:', error);
            toast.error('Failed to fetch invoice details');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const response = await fetch(`https://samaaroh-1.onrender.com/api/invoices/${invoiceId}/generate-pdf`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();
            if (response.ok) {
                window.open(`https://samaaroh-1.onrender.com${data.data.pdfUrl}`, '_blank');
                toast.success('PDF generated successfully');
            } else {
                toast.error(data.error || 'Failed to generate PDF');
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF');
        }
    };

    const handleSendEmail = async () => {
        if (!emailAddress) {
            toast.error('Please enter an email address');
            return;
        }

        setSendingEmail(true);
        try {
            const response = await fetch(`https://samaaroh-1.onrender.com/api/invoices/${invoiceId}/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ email: emailAddress })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Invoice sent successfully!');
                setShowEmailDialog(false);

                // Update invoice status to 'sent'
                await updateStatus('sent');
            } else {
                toast.error(data.error || 'Failed to send email');
            }
        } catch (error) {
            console.error('Error sending email:', error);
            toast.error('Failed to send email');
        } finally {
            setSendingEmail(false);
        }
    };

    const updateStatus = async (newStatus) => {
        try {
            const response = await fetch(`https://samaaroh-1.onrender.com/api/invoices/${invoiceId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();
            if (response.ok) {
                setInvoice(data.data);
                if (onUpdate) onUpdate();
                toast.success(`Invoice marked as ${newStatus}`);
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-700',
            sent: 'bg-blue-100 text-blue-700',
            paid: 'bg-green-100 text-green-700',
            partial: 'bg-yellow-100 text-yellow-700',
            overdue: 'bg-red-100 text-red-700',
            cancelled: 'bg-gray-100 text-gray-500'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className="fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : invoice ? (
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold">Invoice Details</h2>
                                <p className="text-gray-300 mt-1">{invoice.invoiceNumber}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <CloseCircle size={24} />
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="bg-gray-50 border-b px-6 py-4">
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={handleDownloadPDF}
                                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    <DocumentDownload size={20} />
                                    <span>Download PDF</span>
                                </button>

                                <button
                                    onClick={() => setShowEmailDialog(true)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <Sms size={20} />
                                    <span>Email Invoice</span>
                                </button>

                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Printer size={20} />
                                    <span>Print</span>
                                </button>

                                {invoice.status !== 'paid' && (
                                    <button
                                        onClick={() => updateStatus('paid')}
                                        className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                    >
                                        <TickCircle size={20} />
                                        <span>Mark Paid</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Invoice Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Professional Invoice Design */}
                            <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
                                {/* Invoice Header - Dark Professional Header */}
                                <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-white p-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>

                                    <div className="relative z-10 flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center space-x-3 mb-2">
                                                <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                                                    <span className="text-2xl font-bold text-gray-900">
                                                        {invoice.organizationId?.name?.charAt(0) || 'S'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h1 className="text-3xl font-bold">{invoice.organizationId?.name || 'Your Company'}</h1>
                                                </div>
                                            </div>
                                            <div className="text-gray-300 text-sm space-y-1 mt-4">
                                                <p>{invoice.organizationId?.phone || ''}</p>
                                                <p>{invoice.organizationId?.email || ''}</p>
                                                <p>{invoice.organizationId?.address || ''}</p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <h2 className="text-4xl font-bold mb-4">INVOICE</h2>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between space-x-8">
                                                    <span className="text-gray-400">Invoice No:</span>
                                                    <span className="font-semibold">{invoice.invoiceNumber}</span>
                                                </div>
                                                <div className="flex justify-between space-x-8">
                                                    <span className="text-gray-400">Date:</span>
                                                    <span className="font-semibold">{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</span>
                                                </div>
                                                <div className="flex justify-between space-x-8">
                                                    <span className="text-gray-400">Due Date:</span>
                                                    <span className="font-semibold">{new Date(invoice.dueDate).toLocaleDateString('en-IN')}</span>
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                                                    {invoice.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bill To Section */}
                                <div className="p-8 bg-gray-50">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To:</h3>
                                            <div className="text-gray-900">
                                                <p className="font-bold text-lg">{invoice.clientId?.name}</p>
                                                <p className="text-sm text-gray-600 mt-1">{invoice.clientId?.phone}</p>
                                                {invoice.clientId?.email && (
                                                    <p className="text-sm text-gray-600">{invoice.clientId.email}</p>
                                                )}
                                                {invoice.eventId && (
                                                    <p className="text-sm text-gray-600 mt-2">
                                                        Event: <span className="font-medium">{invoice.eventId.eventName}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="p-8">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-yellow-500 text-gray-900">
                                                <th className="px-4 py-3 text-left font-semibold">ITEM DESCRIPTION</th>
                                                <th className="px-4 py-3 text-right font-semibold">PRICE</th>
                                                <th className="px-4 py-3 text-right font-semibold">QTY</th>
                                                <th className="px-4 py-3 text-right font-semibold">TOTAL</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {invoice.items.map((item, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-4 py-4">
                                                        <p className="font-medium text-gray-900">{item.description}</p>
                                                    </td>
                                                    <td className="px-4 py-4 text-right text-gray-700">
                                                        ₹{item.unitPrice.toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="px-4 py-4 text-right text-gray-700">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="px-4 py-4 text-right font-semibold text-gray-900">
                                                        ₹{item.amount.toLocaleString('en-IN')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Totals Section */}
                                    <div className="mt-8 flex justify-end">
                                        <div className="w-80">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-gray-700">
                                                    <span>Sub Total:</span>
                                                    <span className="font-medium">₹{invoice.subtotal.toLocaleString('en-IN')}</span>
                                                </div>

                                                {invoice.discount > 0 && (
                                                    <div className="flex justify-between text-red-600">
                                                        <span>
                                                            Discount {invoice.discountType === 'percentage' ? `(${invoice.discount}%)` : ''}:
                                                        </span>
                                                        <span className="font-medium">
                                                            -₹{(invoice.discountType === 'percentage'
                                                                ? (invoice.subtotal * invoice.discount) / 100
                                                                : invoice.discount).toLocaleString('en-IN')}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex justify-between text-gray-700">
                                                    <span>Tax (Vat {invoice.taxRate}%):</span>
                                                    <span className="font-medium">₹{invoice.taxAmount.toLocaleString('en-IN')}</span>
                                                </div>

                                                <div className="border-t-2 border-gray-300 pt-2 mt-2"></div>

                                                <div className="bg-yellow-500 px-4 py-3 rounded-lg flex justify-between items-center">
                                                    <span className="text-lg font-bold text-gray-900">GRAND TOTAL</span>
                                                    <span className="text-2xl font-bold text-gray-900">
                                                        ₹{invoice.total.toLocaleString('en-IN')}
                                                    </span>
                                                </div>

                                                {invoice.paidAmount > 0 && (
                                                    <>
                                                        <div className="flex justify-between text-green-600">
                                                            <span>Paid:</span>
                                                            <span className="font-medium">₹{invoice.paidAmount.toLocaleString('en-IN')}</span>
                                                        </div>
                                                        <div className="flex justify-between text-orange-600 font-bold">
                                                            <span>Balance Due:</span>
                                                            <span>₹{invoice.balanceAmount.toLocaleString('en-IN')}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Terms & Notes */}
                                <div className="px-8 pb-8 space-y-6">
                                    {invoice.terms && (
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-2">TERMS & CONDITIONS:</h3>
                                            <p className="text-sm text-gray-600 leading-relaxed">{invoice.terms}</p>
                                        </div>
                                    )}

                                    {invoice.notes && (
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-2">NOTES:</h3>
                                            <p className="text-sm text-gray-600 leading-relaxed">{invoice.notes}</p>
                                        </div>
                                    )}

                                    <div className="border-t pt-6 text-center">
                                        <p className="text-lg font-semibold text-gray-900 mb-2">Thank you for your business!</p>
                                        <p className="text-sm text-gray-500">
                                            Created by {invoice.createdBy?.name} on {new Date(invoice.createdAt).toLocaleDateString('en-IN')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">Invoice not found</p>
                    </div>
                )}
            </div>

            {/* Email Dialog */}
            {showEmailDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Send Invoice via Email</h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={emailAddress}
                                onChange={(e) => setEmailAddress(e.target.value)}
                                placeholder="client@example.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-blue-800">
                                Invoice PDF will be attached to the email automatically.
                            </p>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={handleSendEmail}
                                disabled={sendingEmail}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sendingEmail ? 'Sending...' : 'Send Email'}
                            </button>
                            <button
                                onClick={() => setShowEmailDialog(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default InvoiceDetailSidebar;
