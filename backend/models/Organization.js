const mongoose = require('mongoose');

const organizationSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  ownerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  phone: {
    type: String,
  },
  email: {
    type: String,
  },
  city: {
    type: String,
  },
  address: {
    type: String,
  },
  serviceType: {
    type: String,
  },
  website: {
    type: String,
  },
  logo: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const Organization = mongoose.model('Organization', organizationSchema);
module.exports = Organization;
