const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true,
    index: true 
  },
  
  // === ENTITY LINKING ===
  entityType: { 
    type: String, 
    enum: ['event', 'client', 'vendor', 'organization', 'venue', 'invoice'],
    required: true,
    index: true
  },
  entityId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    index: true
  },
  
  // Special reference for invoices
  invoiceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Invoice' 
  },
  
  // === DOCUMENT INFO ===
  name: { 
    type: String, 
    required: true 
  },
  originalFileName: String,
  fileUrl: {
    type: String,
    required: true
  },
  fileSize: Number,
  mimeType: String,
  
  // === CATEGORIZATION ===
  category: {
    type: String,
    enum: [
      'invoice',
      'contract',
      'permit',
      'insurance',
      'floor_plan',
      'mood_board',
      'quote',
      'receipt',
      'other'
    ],
    required: true,
    index: true
  },
  subcategory: String,
  tags: [String],
  
  // === INVOICE-SPECIFIC METADATA ===
  invoiceMetadata: {
    invoiceNumber: String,
    invoiceDate: Date,
    dueDate: Date,
    amount: Number,
    status: String,
    paidAmount: Number,
    balanceAmount: Number
  },
  
  // === VERSION CONTROL ===
  version: { 
    type: Number, 
    default: 1 
  },
  versions: [{
    versionNumber: Number,
    fileUrl: String,
    uploadedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    uploadedAt: { 
      type: Date, 
      default: Date.now 
    },
    changeNote: String,
    fileSize: Number
  }],
  
  // === METADATA ===
  description: String,
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  uploadedAt: { 
    type: Date, 
    default: Date.now 
  },
  
  // === STATUS ===
  status: {
    type: String,
    enum: ['draft', 'active', 'archived', 'expired'],
    default: 'active'
  },
  
  // === ACCESS CONTROL ===
  visibility: {
    type: String,
    enum: ['private', 'team', 'client', 'public'],
    default: 'team'
  },
  sharedWith: [{ 
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    email: String,
    accessLevel: {
      type: String,
      enum: ['view', 'download', 'edit'],
      default: 'view'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // === EXPIRY (for permits, insurance) ===
  expiryDate: Date,
  reminderDays: {
    type: Number,
    default: 30
  },
  
  // === TRACKING ===
  lastViewedAt: Date,
  viewCount: {
    type: Number,
    default: 0
  },
  
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true 
});

// Compound Indexes for performance
DocumentSchema.index({ organizationId: 1, category: 1 });
DocumentSchema.index({ entityType: 1, entityId: 1 });
DocumentSchema.index({ invoiceId: 1 });
DocumentSchema.index({ organizationId: 1, isActive: 1 });
DocumentSchema.index({ expiryDate: 1 });

// Virtual for full entity reference
DocumentSchema.virtual('entity', {
  refPath: 'entityType',
  localField: 'entityId',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Document', DocumentSchema);
