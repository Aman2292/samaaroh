const mongoose = require('mongoose');

const organizationSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  ownerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  logo: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active',
    index: true
  },
  suspendedAt: {
    type: Date
  },
  suspendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  suspensionReason: {
    type: String
  },
  taskStatuses: [{
    value: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    color: {
      type: String,
      default: '#64748B'
    },
    bgColor: {
      type: String,
      default: '#F1F5F9'
    },
    icon: {
      type: String
    },
    order: {
      type: Number,
      default: 0
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  defaultTaskStatuses: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Organization = mongoose.model('Organization', organizationSchema);
module.exports = Organization;
