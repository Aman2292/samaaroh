const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true
  }
});

const invoiceSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  // References
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  
  // Dates
  invoiceDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  
  // Items
  items: {
    type: [invoiceItemSchema],
    required: true,
    validate: [array => array.length > 0, 'Invoice must have at least one item']
  },
  
  // Calculations
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 18,
    min: 0,
    max: 100
  },
  taxAmount: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'fixed'
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Payment Tracking
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  balanceAmount: {
    type: Number,
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'],
    default: 'draft'
  },
  
  // Document
  pdfUrl: String,
  
  // Notes
  notes: String,
  terms: {
    type: String,
    default: 'Payment is due within 30 days of invoice date.'
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sentAt: Date,
  paidAt: Date
}, {
  timestamps: true
});

// Index for faster queries
invoiceSchema.index({ organizationId: 1, invoiceNumber: 1 });
invoiceSchema.index({ clientId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
