const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const clientSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  city: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique phone numbers within an organization
clientSchema.index({ organizationId: 1, phone: 1 }, { unique: true });

// Add pagination plugin
clientSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Client', clientSchema);
