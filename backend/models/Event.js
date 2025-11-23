const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const eventSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  eventName: {
    type: String,
    required: true,
    trim: true
  },
  eventType: {
    type: String,
    enum: ['wedding', 'birthday', 'corporate', 'anniversary', 'engagement', 'other'],
    default: 'other'
  },
  eventDate: {
    type: Date,
    required: true,
    index: true
  },
  venue: {
    type: String,
    trim: true
  },
  estimatedBudget: {
    type: Number,
    default: 0
  },
  actualBudget: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['lead', 'booked', 'in_progress', 'completed', 'cancelled'],
    default: 'lead',
    index: true
  },
  leadPlannerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedCoordinators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Add pagination plugin
eventSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Event', eventSchema);
