import Select from '../common/Select';
import DatePicker from '../common/DatePicker';

// ... (imports remain same)

const AddPaymentModal = ({ onClose, onSuccess, eventId, clientId }) => {
    const [loading, setLoading] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    const { register, handleSubmit, watch, control, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            paymentType: 'client_payment',
            dueDate: new Date().toISOString().split('T')[0]
        }
    });

    // ... (onSubmit remains same)

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800">Add Payment</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <CloseCircle size="24" color="currentColor" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    {/* Payment Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Payment Type *</label>
                        <div className="flex space-x-4">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="radio" {...register('paymentType')} value="client_payment" className="text-primary-600 focus:ring-primary-500" />
                                <span className="text-slate-700">Client Payment</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="radio" {...register('paymentType')} value="vendor_payment" className="text-primary-600 focus:ring-primary-500" />
                                <span className="text-slate-700">Vendor Payment</span>
                            </label>
                        </div>
                        {errors.paymentType && <p className="mt-1 text-sm text-red-600">{errors.paymentType.message}</p>}
                    </div>

                    {/* Conditional Fields for Vendor Payment */}
                    {paymentType === 'vendor_payment' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Name *</label>
                                    <input
                                        type="text"
                                        {...register('vendorName')}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Enter vendor name"
                                    />
                                    {errors.vendorName && <p className="mt-1 text-sm text-red-600">{errors.vendorName.message}</p>}
                                </div>

                                <div>
                                    <Select
                                        label="Vendor Category"
                                        name="vendorCategory"
                                        control={control}
                                        error={errors.vendorCategory}
                                        required
                                        options={[
                                            { value: 'catering', label: 'Catering' },
                                            { value: 'decoration', label: 'Decoration' },
                                            { value: 'photography', label: 'Photography' },
                                            { value: 'videography', label: 'Videography' },
                                            { value: 'venue', label: 'Venue' },
                                            { value: 'dj', label: 'DJ/Music' },
                                            { value: 'makeup', label: 'Makeup & Beauty' },
                                            { value: 'transport', label: 'Transport' },
                                            { value: 'other', label: 'Other' }
                                        ]}
                                        placeholder="Select category"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Description * {paymentType === 'client_payment' && <span className="text-xs text-slate-500">(e.g., Advance Payment, 2nd Installment, Final Payment)</span>}
                        </label>
                        <input
                            type="text"
                            {...register('description')}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder={paymentType === 'client_payment' ? 'Advance Payment' : 'Service description'}
                        />
                        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                    </div>

                    {/* Amount and Due Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹) *</label>
                            <input
                                type="number"
                                {...register('amount')}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="0"
                                step="0.01"
                            />
                            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
                        </div>

                        <div>
                            <DatePicker
                                label="Due Date"
                                name="dueDate"
                                control={control}
                                error={errors.dueDate}
                                required
                                minDate={new Date()}
                                placeholder="Select date"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                        <textarea
                            {...register('notes')}
                            rows="3"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                            placeholder="Add any additional notes..."
                        />
                        {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Adding...' : 'Add Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPaymentModal;
