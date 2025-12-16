import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Add, Trash, ArrowLeft, DocumentText1 } from 'iconsax-react';

const CreateInvoice = ({ mode = 'create' }) => {
    const [clients, setClients] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        clientId: '',
        eventId: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        taxRate: 18,
        discount: 0,
        discountType: 'fixed',
        notes: '',
        terms: 'Payment is due within 30 days of invoice date.'
    });

    const [items, setItems] = useState([
        { description: '', quantity: 1, unitPrice: 0 }
    ]);

    const navigate = useNavigate();
    const { id: invoiceId } = useParams();
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const isEditMode = mode === 'edit' && invoiceId;
    const [readOnly, setReadOnly] = useState(false);

    useEffect(() => {
        fetchClients();
        fetchEvents();

        if (isEditMode) {
            fetchInvoiceData();
        } else {
            // Set default due date (30 days from now) only for create mode
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30);
            setFormData(prev => ({ ...prev, dueDate: dueDate.toISOString().split('T')[0] }));
        }
    }, [isEditMode]);

    const fetchClients = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/clients', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setClients(data.data);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const fetchEvents = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/events', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setEvents(data.data);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const fetchInvoiceData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5001/api/invoices/${invoiceId}`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await response.json();

            if (response.ok) {
                const invoice = data.data;

                // Check if invoice can be edited
                if (invoice.status !== 'draft') {
                    setReadOnly(true);
                    toast.info('This invoice cannot be edited as it has been sent or paid');
                }

                // Populate form data
                setFormData({
                    clientId: invoice.clientId?._id || '',
                    eventId: invoice.eventId?._id || '',
                    invoiceDate: invoice.invoiceDate.split('T')[0],
                    dueDate: invoice.dueDate.split('T')[0],
                    taxRate: invoice.taxRate,
                    discount: invoice.discount,
                    discountType: invoice.discountType,
                    notes: invoice.notes || '',
                    terms: invoice.terms || ''
                });

                // Populate items
                setItems(invoice.items.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice
                })));
            } else {
                toast.error(data.error || 'Failed to fetch invoice');
                navigate('/invoices');
            }
        } catch (error) {
            console.error('Error fetching invoice:', error);
            toast.error('Failed to fetch invoice');
            navigate('/invoices');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    };

    const calculateDiscount = () => {
        const subtotal = calculateSubtotal();
        if (formData.discountType === 'percentage') {
            return (subtotal * formData.discount) / 100;
        }
        return parseFloat(formData.discount) || 0;
    };

    const calculateTax = () => {
        const subtotal = calculateSubtotal();
        const discount = calculateDiscount();
        const taxableAmount = subtotal - discount;
        return (taxableAmount * formData.taxRate) / 100;
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const discount = calculateDiscount();
        const tax = calculateTax();
        return subtotal - discount + tax;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if read-only
        if (readOnly) {
            toast.error('This invoice cannot be edited');
            return;
        }

        // Validation
        if (!formData.clientId) {
            toast.error('Please select a client');
            return;
        }

        if (items.some(item => !item.description || item.quantity <= 0 || item.unitPrice < 0)) {
            toast.error('Please fill all item details correctly');
            return;
        }

        setLoading(true);

        try {
            const invoiceData = {
                ...formData,
                items: items.map(item => ({
                    description: item.description,
                    quantity: parseFloat(item.quantity),
                    unitPrice: parseFloat(item.unitPrice)
                })),
                taxRate: parseFloat(formData.taxRate),
                discount: parseFloat(formData.discount) || 0
            };

            const url = isEditMode
                ? `http://localhost:5001/api/invoices/${invoiceId}`
                : 'http://localhost:5001/api/invoices';

            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify(invoiceData)
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(isEditMode ? 'Invoice updated successfully!' : 'Invoice created successfully!');
                navigate(`/invoices/${data.data._id}`);
            } else {
                toast.error(data.error || `Failed to ${isEditMode ? 'update' : 'create'} invoice`);
            }
        } catch (error) {
            console.error('Error saving invoice:', error);
            toast.error(`Failed to ${isEditMode ? 'update' : 'create'} invoice`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-6">
                <button
                    onClick={() => navigate('/invoices')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEditMode ? 'Edit Invoice' : 'Create Invoice'}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {isEditMode ? 'Update invoice details' : 'Generate a new invoice for your client'}
                    </p>
                </div>
            </div>

            {/* Read-Only Warning */}
            {readOnly && (
                <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                    <div className="flex items-center">
                        <div className="flex-1">
                            <p className="text-yellow-800 font-medium">
                                ⚠️ This invoice cannot be edited because it has been sent or paid.
                            </p>
                            <p className="text-yellow-700 text-sm mt-1">
                                Only draft invoices can be modified. You can view the invoice details below.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form - 2/3 width */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Client & Event Selection */}
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h2 className="text-lg font-semibold mb-4">Client Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Client <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="clientId"
                                        value={formData.clientId}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">Select Client</option>
                                        {clients.map(client => (
                                            <option key={client._id} value={client._id}>
                                                {client.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Event (Optional)
                                    </label>
                                    <select
                                        name="eventId"
                                        value={formData.eventId}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">Select Event</option>
                                        {events.map(event => (
                                            <option key={event._id} value={event._id}>
                                                {event.eventName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h2 className="text-lg font-semibold mb-4">Invoice Dates</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Invoice Date
                                    </label>
                                    <input
                                        type="date"
                                        name="invoiceDate"
                                        value={formData.invoiceDate}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Due Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="dueDate"
                                        value={formData.dueDate}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold">Invoice Items</h2>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="flex items-center space-x-1 text-primary-600 hover:text-primary-700"
                                >
                                    <Add size={20} />
                                    <span>Add Item</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                {items.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-4 items-start">
                                        <div className="col-span-6">
                                            <input
                                                type="text"
                                                placeholder="Item description"
                                                value={item.description}
                                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                placeholder="Qty"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                min="1"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>

                                        <div className="col-span-3">
                                            <input
                                                type="number"
                                                placeholder="Unit Price"
                                                value={item.unitPrice}
                                                onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                                min="0"
                                                step="0.01"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>

                                        <div className="col-span-1 flex items-center justify-center">
                                            {items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash size={20} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tax & Discount */}
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h2 className="text-lg font-semibold mb-4">Tax & Discount</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tax Rate (%)
                                    </label>
                                    <input
                                        type="number"
                                        name="taxRate"
                                        value={formData.taxRate}
                                        onChange={handleInputChange}
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Discount Type
                                    </label>
                                    <select
                                        name="discountType"
                                        value={formData.discountType}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="fixed">Fixed Amount</option>
                                        <option value="percentage">Percentage</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Discount {formData.discountType === 'percentage' ? '(%)' : '(₹)'}
                                    </label>
                                    <input
                                        type="number"
                                        name="discount"
                                        value={formData.discount}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Notes & Terms */}
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        rows="3"
                                        placeholder="Add any additional notes for this invoice..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Terms & Conditions
                                    </label>
                                    <textarea
                                        name="terms"
                                        value={formData.terms}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Live Invoice Preview - 1/3 width */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-4 flex flex-col" style={{ maxHeight: 'calc(100vh - 32px)' }}>
                            <div className="bg-white rounded-xl shadow-lg border overflow-hidden flex flex-col" style={{ height: '100%' }}>
                                {/* Preview Header */}
                                <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 flex-shrink-0">
                                    <h2 className="text-white font-semibold flex items-center space-x-2">
                                        <DocumentText1 size={20} />
                                        <span>Live Preview</span>
                                    </h2>
                                </div>

                                {/* Invoice Preview - Scrollable */}
                                <div className="p-4 bg-gray-50 flex-1 overflow-y-auto">{/* Added overflow-y-auto and flex-1 */}
                                    <div className="bg-white rounded-lg shadow-sm border p-4 text-xs">
                                        {/* INVOICE Title */}
                                        <div className="text-center mb-3">
                                            <h1 className="text-2xl font-bold text-primary-600">INVOICE</h1>
                                        </div>

                                        {/* Organization & Invoice Details */}
                                        <div className="grid grid-cols-2 gap-3 mb-4 text-[10px]">
                                            <div>
                                                <p className="font-bold text-gray-900">{userInfo.organizationName || 'Your Company'}</p>
                                                <p className="text-gray-600">{userInfo.email || ''}</p>
                                            </div>
                                            <div className="text-right text-[9px]">
                                                <div className="space-y-0.5">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Invoice No:</span>
                                                        <span className="font-semibold">INV-NEW</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Date:</span>
                                                        <span>{new Date(formData.invoiceDate).toLocaleDateString('en-IN')}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Due:</span>
                                                        <span>{formData.dueDate ? new Date(formData.dueDate).toLocaleDateString('en-IN') : '-'}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-2">
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[8px] rounded-full font-medium">DRAFT</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bill To */}
                                        <div className="mb-3 p-2 bg-blue-50 rounded">
                                            <p className="text-[9px] font-bold text-primary-600 mb-1">Bill To:</p>
                                            <p className="font-semibold text-gray-900 text-[10px]">
                                                {formData.clientId ? clients.find(c => c._id === formData.clientId)?.name : 'Select Client'}
                                            </p>
                                            {formData.eventId && (
                                                <p className="text-gray-600 text-[9px] mt-0.5">
                                                    Event: {events.find(e => e._id === formData.eventId)?.eventName}
                                                </p>
                                            )}
                                        </div>

                                        {/* Items Table */}
                                        <div className="mb-3">
                                            <table className="w-full text-[8px]">
                                                <thead>
                                                    <tr className="bg-yellow-100 border-b border-yellow-200">
                                                        <th className="text-left px-1 py-1 font-semibold text-gray-900">Description</th>
                                                        <th className="text-center px-1 py-1 font-semibold text-gray-900">Qty</th>
                                                        <th className="text-right px-1 py-1 font-semibold text-gray-900">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {items.map((item, index) => (
                                                        <tr key={index} className="border-b border-gray-100">
                                                            <td className="px-1 py-1.5 text-gray-900">
                                                                {item.description || <span className="text-gray-400 italic">Item {index + 1}</span>}
                                                            </td>
                                                            <td className="px-1 py-1.5 text-center text-gray-700">{item.quantity || 0}</td>
                                                            <td className="px-1 py-1.5 text-right font-medium text-gray-900">
                                                                ₹{((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString('en-IN')}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Totals */}
                                        <div className="space-y-1 text-[9px] ml-auto" style={{ width: '60%' }}>
                                            <div className="flex justify-between text-gray-700">
                                                <span>Subtotal:</span>
                                                <span className="font-medium">₹{calculateSubtotal().toLocaleString('en-IN')}</span>
                                            </div>

                                            {formData.discount > 0 && (
                                                <div className="flex justify-between text-red-600 text-[8px]">
                                                    <span>Discount {formData.discountType === 'percentage' ? `(${formData.discount}%)` : ''}:</span>
                                                    <span className="font-medium">-₹{calculateDiscount().toLocaleString('en-IN')}</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between text-gray-700">
                                                <span>Tax ({formData.taxRate}%):</span>
                                                <span className="font-medium">₹{calculateTax().toLocaleString('en-IN')}</span>
                                            </div>

                                            <div className="border-t border-gray-300 pt-1 mt-1"></div>

                                            <div className="bg-yellow-400 px-2 py-1.5 rounded flex justify-between items-center">
                                                <span className="font-bold text-gray-900 text-[10px]">TOTAL</span>
                                                <span className="font-bold text-gray-900 text-sm">₹{calculateTotal().toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>

                                        {/* Notes Preview */}
                                        {formData.notes && (
                                            <div className="mt-3 p-2 bg-gray-50 rounded">
                                                <p className="text-[8px] font-semibold text-gray-900 mb-0.5">NOTES:</p>
                                                <p className="text-[8px] text-gray-600 leading-relaxed">{formData.notes}</p>
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <div className="mt-3 pt-2 border-t text-center">
                                            <p className="text-[9px] font-semibold text-gray-900">Thank you for your business!</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons - Fixed at bottom */}
                            <div className="p-4 bg-white border-t space-y-3 flex-shrink-0">
                                {!readOnly && (
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                    >
                                        {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Invoice' : 'Create Invoice')}
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => navigate('/invoices')}
                                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    {readOnly ? 'Back to Invoices' : 'Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateInvoice;
