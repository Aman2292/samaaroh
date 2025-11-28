const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional because system notifications might not have a specific sender user
  },
  senderRole: {
    type: String,
    required: false
  },
  type: {
    type: String,
    required: true,
    enum: ['payment_overdue', 'payment_received', 'team_joined', 'event_assigned', 'event_reminder', 'system', 'manual_alert'],
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  link: {
    type: String // URL to navigate to when clicked
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed // Additional data like eventId, paymentId, etc.
  }
}, {
  timestamps: true
});

// Index for efficient querying
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

// TTL index to auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
