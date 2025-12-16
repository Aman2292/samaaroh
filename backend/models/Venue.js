const mongoose = require('mongoose');

const venueSchema = mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
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
  }],
  isActive: {
      type: Boolean,
      default: true
  }
}, {
  timestamps: true
});

const Venue = mongoose.model('Venue', venueSchema);
module.exports = Venue;
