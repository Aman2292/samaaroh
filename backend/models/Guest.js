const mongoose = require('mongoose');
const crypto = require('crypto');

const GuestSchema = new mongoose.Schema({
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
  
  // Personal Info
  firstName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  lastName: { 
    type: String, 
    trim: true 
  },
  email: { 
    type: String, 
    lowercase: true, 
    trim: true 
  },
  phone: { 
    type: String, 
    trim: true 
  },
  
  // Classification
  guestType: { 
    type: String, 
    enum: ['family', 'friend', 'colleague', 'vip', 'vendor', 'other'],
    default: 'friend'
  },
  category: String, // Custom category
  side: { 
    type: String, 
    enum: ['bride', 'groom', 'both', 'neutral'],
    default: 'neutral'
  },
  
  // Group/Family
  groupId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'GuestGroup' 
  },
  isPrimaryContact: { 
    type: Boolean, 
    default: false 
  },
  
  // RSVP
  invitationSent: { 
    type: Boolean, 
    default: false 
  },
  invitationSentDate: Date,
  rsvpStatus: { 
    type: String, 
    enum: ['pending', 'attending', 'not_attending', 'maybe'],
    default: 'pending',
    index: true
  },
  rsvpDate: Date,
  rsvpToken: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  
  // Plus One
  plusOne: { 
    type: Boolean, 
    default: false 
  },
  plusOneName: String,
  plusOneAttending: Boolean,
  
  // Dietary & Special Requests
  dietaryRestrictions: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-allergy', 'halal', 'kosher', 'none', 'other']
  }],
  dietaryNotes: String,
  specialRequests: String,
  
  // Seating (for future phase)
  tableNumber: Number,
  seatNumber: Number,
  tableAssigned: { 
    type: Boolean, 
    default: false 
  },
  
  // Communication Preferences
  whatsappOptIn: { 
    type: Boolean, 
    default: true 
  },
  emailOptIn: { 
    type: Boolean, 
    default: true 
  },
  smsOptIn: { 
    type: Boolean, 
    default: true 
  },
  lastContactedDate: Date,
  
  // Check-in System
  checkedIn: { 
    type: Boolean, 
    default: false 
  },
  checkInTime: Date,
  checkInBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  checkInNotes: String,
  
  // QR Code Check-In (NEW)
  qrCode: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  qrCodeImage: String, // Base64 or URL
  
  // Invitation Type (family = one QR for group, individual = one QR per person)
  invitationType: {
    type: String,
    enum: ['family', 'individual'],
    default: 'family'
  },
  
  // Expected vs Actual Headcount (for family mode)
  expectedHeadcount: {
    type: Number,
    default: 1,
    min: 1
  },
  actualHeadcount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Family Members (for individual mode tracking)
  familyMembers: [{
    name: { type: String, required: true },
    age: { type: String, enum: ['adult', 'child'], default: 'adult' },
    mealPreference: { type: String, enum: ['veg', 'non_veg', 'jain'], default: 'veg' },
    qrCode: { type: String, unique: true, sparse: true },
    qrCodeImage: String,
    checkedIn: { type: Boolean, default: false },
    checkInTime: Date
  }],
  
  // Metadata
  notes: String,
  tags: [String],
  customFields: mongoose.Schema.Types.Mixed,
  
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

// Compound Indexes for performance
GuestSchema.index({ eventId: 1, organizationId: 1 });
GuestSchema.index({ eventId: 1, rsvpStatus: 1 });
GuestSchema.index({ eventId: 1, isDeleted: 1 });
GuestSchema.index({ organizationId: 1, isDeleted: 1 });

// Virtual: Full Name
GuestSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName || ''}`.trim();
});

// Virtual: Calculated Expected Headcount (for RSVP - considers plus one)
GuestSchema.virtual('rsvpExpectedHeadcount').get(function() {
  if (this.rsvpStatus !== 'attending') return 0;
  let count = this.expectedHeadcount || 1;
  if (this.plusOne && this.plusOneAttending !== false) count += 1;
  return count;
});

// Pre-save: Generate RSVP token if not exists
GuestSchema.pre('save', function(next) {
  if (!this.rsvpToken) {
    this.rsvpToken = crypto.randomBytes(20).toString('hex');
  }
  next();
});

// Pre-save: Update RSVP date when status changes
GuestSchema.pre('save', function(next) {
  if (this.isModified('rsvpStatus') && this.rsvpStatus !== 'pending') {
    this.rsvpDate = new Date();
  }
  next();
});

module.exports = mongoose.model('Guest', GuestSchema);
