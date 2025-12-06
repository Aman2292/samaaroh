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
  venueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization.venues'
  },
  estimatedBudget: {
    type: Number,
    default: 0
  },
  actualBudget: {
    type: Number,
    default: 0
  },
  capacity: {
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
  
  // GUEST LIST - Embedded guests array
  guests: [{
    // Basic Info
    name: { type: String, required: true },
    phone: String,
    email: String,
    
    // Categorization
    side: {
      type: String,
      enum: ['bride', 'groom', 'both', 'vendor'],
      required: true
    },
    group: {
      type: String,
      enum: ['family', 'friends', 'vip', 'vendor', 'other'],
      required: true
    },
    
    // RSVP & Attendance
    rsvpStatus: {
      type: String,
      enum: ['invited', 'confirmed', 'declined', 'tentative', 'checked_in'],
      default: 'invited'
    },
    headcount: { type: Number, default: 1 },
    plusOnes: { type: Number, default: 0 },
    
    // Special Requirements
    specialNotes: String,
    dietaryRestrictions: String,
    
    // Source Tracking
    source: {
      type: String,
      enum: ['manual', 'csv_import', 'onsite'],
      default: 'manual'
    },
    addedOnsite: { type: Boolean, default: false },
    checkedInAt: Date,
    
    // Metadata
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Guest Summary (cached for performance)
  guestSummary: {
    totalInvited: { type: Number, default: 0 },
    totalConfirmed: { type: Number, default: 0 },
    totalDeclined: { type: Number, default: 0 },
    expectedHeadcount: { type: Number, default: 0 },
    onsiteAdded: { type: Number, default: 0 },
    checkedIn: { type: Number, default: 0 }
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
