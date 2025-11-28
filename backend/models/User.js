const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'PLANNER_OWNER', 'PLANNER', 'FINANCE', 'COORDINATOR'],
    required: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: function() {
      return this.role !== 'SUPER_ADMIN';
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date
  },
  lastLoginIP: {
    type: String
  },
  loginHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    ip: String,
    userAgent: String
  }],
  // Invitation fields
  invitationStatus: {
    type: String,
    enum: ['pending', 'accepted'],
    default: 'accepted'
  },
  invitationToken: String,
  invitationSentAt: Date,
  invitationExpiresAt: Date,
  // Legacy fields (optional, kept if needed for migration or specific logic)
  businessName: String,
  serviceType: String,
}, {
  timestamps: true,
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Removed pre-save hook for hashing to control it explicitly in service, 
// or we can keep it. The plan used explicit hashing in service. 
// Let's stick to the plan which had explicit hashing in service, 
// BUT standard practice is often pre-save. 
// The user's provided code snippet for registerUser used `bcrypt.hash`.
// So I will NOT include the pre-save hook here to avoid double hashing 
// if the service does it. 
// WAIT, the existing Vendor model HAD a pre-save hook.
// The user's snippet in the prompt:
// `const hashedPassword = await bcrypt.hash(password, 10);`
// So the user intends to hash in the service. I will follow that.

const User = mongoose.model('User', userSchema);
module.exports = User;
