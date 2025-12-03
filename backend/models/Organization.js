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
  teamMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Multiple Venues Support
  venues: [{
    category: {
      type: String,
      enum: ['venue', 'banquet', 'hotel', 'resort', 'lawn', 'decorator', 'caterer', 'photographer', 'other'],
      default: 'venue'
    },
    description: {
      type: String
    },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      coordinates: {
        lat: Number,
        lng: Number
      },
      googleMapsUrl: String
    },
    amenities: [{
      type: String
    }],
    policies: {
      cancellation: String,
      refund: String,
      outsideCatering: {
        type: Boolean,
        default: false
      }
    },
    galleryImages: [{
      type: String // Cloudinary URLs
    }],
    floorPlans: [{
      url: String,
      label: String
    }],
    videoUrls: [String],
    documents: [{
      name: String,
      url: String,
      type: String // 'contract', 'policy', 'other'
    }],
    packages: [{
      name: String, // Silver, Gold, Platinum
      basePrice: Number,
      maxGuests: Number,
      inclusions: [String],
      extraGuestPrice: Number,
      description: String,
      seasonalPricing: [{
        name: String, // e.g., "Peak Season"
        adjustmentType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
        adjustmentValue: Number, // e.g., 20 for +20%
        startDate: Date,
        endDate: Date
      }]
    }],
    availability: [{
      date: Date,
      status: {
        type: String,
        enum: ['available', 'blocked', 'booked'],
        default: 'available'
      },
      notes: String
    }]
  }],
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
