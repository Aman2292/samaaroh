import Select from '../common/Select';
import DatePicker from '../common/DatePicker';

// ... (imports remain same)

const MarkPaidModal = ({ onClose, onSuccess, payment }) => {
    const [loading, setLoading] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    const outstandingAmount = payment.amount - payment.paidAmount;

    // ... (schema remains same)

    const { register, handleSubmit, setValue, control, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            paidDate: new Date().toISOString().split('T')[0],
            paidAmount: outstandingAmount
        }
    });

    // ... (setQuickAmount remains same)

    // ... (onSubmit remains same)

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <MoneyRecive size="24" color="#10b981" variant="Bold" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Mark as Paid</h2>
                            <p className="text-sm text-slate-500">{payment.description}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <CloseCircle size="24" color="currentColor" />
                    </button>
                </div>

                {/* Payment Summary */}
                <div className="p-6 bg-slate-50 border-b border-slate-200">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Total Amount</p>
                            <p className="text-lg font-bold text-slate-800">₹{payment.amount.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Already Paid</p>
                            <p className="text-lg font-bold text-green-600">₹{payment.paidAmount.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Outstanding</p>
                            <p className="text-lg font-bold text-orange-600">₹{outstandingAmount.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    {/* Paid Amount with Quick Buttons */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Paid Amount (₹) *</label>
                        <input
                            type="number"
                            {...register('paidAmount')}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="0"
                            step="0.01"
                        />
                        {errors.paidAmount && <p className="mt-1 text-sm text-red-600">{errors.paidAmount.message}</p>}

                        {/* Quick Amount Buttons */}
                        <div className="flex space-x-2 mt-2">
                            <button
                                type="button"
                                onClick={() => setQuickAmount(25)}
                                className="px-3 py-1 text-xs border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                            >
                                25%
                            </button>
                            <button
                                type="button"
                                onClick={() => setQuickAmount(50)}
                                className="px-3 py-1 text-xs border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                            >
                                50%
                            </button>
                            <button
                                type="button"
                                onClick={() => setQuickAmount(75)}
                                className="px-3 py-1 text-xs border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                            >
                                75%
                            </button>
                            <button
                                type="button"
                                onClick={() => setValue('paidAmount', outstandingAmount)}
                                className="px-3 py-1 text-xs bg-primary-50 text-primary-700 border border-primary-200 rounded-md hover:bg-primary-100 transition-colors font-medium"
                            >
                                Full Amount
                            </button>
                        </div>
                    </div>

                    {/* Payment Date and Method */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <DatePicker
                                label="Payment Date"
                                name="paidDate"
                                control={control}
                                error={errors.paidDate}
                                required
                                placeholder="Select date"
                            />
                        </div>

                        <div>
                            <Select
                                label="Payment Method"
                                name="paymentMethod"
                                register={register}
                                error={errors.paymentMethod}
                                required
                                options={[
                                    { value: 'cash', label: 'Cash' },
                                    { value: 'upi', label: 'UPI' },
                                    { value: 'bank_transfer', label: 'Bank Transfer' },
                                    { value: 'cheque', label: 'Cheque' },
                                    { value: 'card', label: 'Card' },
                                    { value: 'online', label: 'Online' }
                                ]}
                                placeholder="Select method"
                            />
                        </div>
                    </div>

                    {/* Transaction Reference */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Transaction Reference <span className="text-xs text-slate-500">(UTR, Cheque No., etc.)</span>
                        </label>
                        <input
                            type="text"
                            {...register('transactionReference')}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Optional"
                        />
                        {errors.transactionReference && <p className="mt-1 text-sm text-red-600">{errors.transactionReference.message}</p>}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                        <textarea
                            {...register('notes')}
                            rows="2"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                            placeholder="Add any notes about this payment..."
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
                            className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Recording...' : 'Record Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MarkPaidModal;
