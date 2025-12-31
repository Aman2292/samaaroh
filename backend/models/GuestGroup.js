const mongoose = require('mongoose');

const GuestGroupSchema = new mongoose.Schema({
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true,
    index: true 
  },
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true,
    index: true 
  },
  
  groupName: { 
    type: String, 
    required: true 
  }, // e.g., "Smith Family", "College Friends"
  
  groupType: {
    type: String,
    enum: ['family', 'friends', 'colleagues', 'other'],
    default: 'family'
  },
  
  primaryContactId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Guest' 
  },
  
  // Seating preference (assign whole group together)
  tableNumber: Number,
  seatingPreference: String, // "Near entrance", "Close to stage", etc.
  
  // Metadata
  notes: String,
  
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
  isDeleted: { 
    type: Boolean, 
    default: false, 
    index: true 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index
GuestGroupSchema.index({ eventId: 1, organizationId: 1 });

// Virtual: Member count
GuestGroupSchema.virtual('memberCount', {
  ref: 'Guest',
  localField: '_id',
  foreignField: 'groupId',
  count: true
});

module.exports = mongoose.model('GuestGroup', GuestGroupSchema);
