const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const PaymentSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization',
    required: true,
    index: true
  },
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true,
    index: true
  },
  paymentType: { 
    type: String, 
    enum: ['client_payment', 'vendor_payment'],
    required: true,
    index: true
  },
  
  // For client payments
  clientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Client'
  },
  
  // Link to invoice (optional - for invoice-based payments)
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    default: null,
    index: true
  },
  
  // For vendor payments
  vendorName: { type: String },
  vendorCategory: { 
    type: String,
    enum: ['catering', 'decoration', 'photography', 'videography', 'venue', 'dj', 'makeup', 'transport', 'other']
  },
  
  // Payment details
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  dueDate: { type: Date, required: true, index: true },
  
  // Payment status
  status: { 
    type: String, 
    enum: ['pending', 'partially_paid', 'paid', 'overdue'],
    default: 'pending',
    index: true
  },
  paidAmount: { type: Number, default: 0, min: 0 },
  paidDate: { type: Date },
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'upi', 'bank_transfer', 'cheque', 'card', 'online']
  },
  
  // References
  transactionReference: { type: String },
  
  // Notes and attachments
  notes: { type: String },
  receiptUrl: { type: String },
  
  // Reminders
  reminderSent: { type: Boolean, default: false },
  lastReminderDate: { type: Date },
  
  // Tracking
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  
  isDeleted: { type: Boolean, default: false, index: true }
}, {
  timestamps: true
});

// Compound indexes for performance
PaymentSchema.index({ organizationId: 1, eventId: 1 });
PaymentSchema.index({ organizationId: 1, status: 1, dueDate: 1 });
PaymentSchema.index({ organizationId: 1, paymentType: 1, status: 1 });

// Virtual: Outstanding amount
PaymentSchema.virtual('outstandingAmount').get(function() {
  return this.amount - this.paidAmount;
});

// Ensure virtuals are included in JSON
PaymentSchema.set('toJSON', { virtuals: true });
PaymentSchema.set('toObject', { virtuals: true });

// Pre-save: Auto-update status based on payment
PaymentSchema.pre('save', function(next) {
  // Update status based on payment
  if (this.paidAmount >= this.amount) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partially_paid';
  } else if (this.dueDate < new Date() && this.status === 'pending') {
    this.status = 'overdue';
  }
  next();
});

// Plugin for pagination
PaymentSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Payment', PaymentSchema);
