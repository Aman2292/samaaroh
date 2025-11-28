const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create a notification
 */
const createNotification = async (userId, organizationId, type, title, message, link = null, metadata = null) => {
  try {
    await Notification.create({
      userId,
      organizationId,
      type,
      title,
      message,
      link,
      metadata
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    // Don't throw - notification failure shouldn't break the main operation
  }
};

/**
 * Get user notifications
 */
const getUserNotifications = async (userId, limit = 50) => {
  try {
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    return {
      notifications,
      unreadCount
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOne({ _id: notificationId, userId });
    
    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    await notification.save();

    return notification;
  } catch (error) {
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (userId) => {
  try {
    await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );
  } catch (error) {
    throw error;
  }
};

/**
 * Create payment due notification (for PLANNER)
 */
const notifyPaymentDue = async (payment, event, planner) => {
  const title = 'Payment Due Tomorrow';
  const message = `Client payment of ₹${payment.amount.toLocaleString('en-IN')} for ${event.eventName} is due tomorrow`;
  const link = `/events/${event._id}`;

  await createNotification(
    planner._id,
    planner.organizationId,
    'payment_due',
    title,
    message,
    link,
    { paymentId: payment._id, eventId: event._id }
  );
};

/**
 * Create payment overdue notification
 */
const notifyPaymentOverdue = async (payment, users) => {
  const title = 'Payment Overdue';
  const message = `Payment of ₹${payment.amount.toLocaleString('en-IN')} for ${payment.eventId?.eventName || 'event'} is overdue`;
  const link = `/events/${payment.eventId?._id}`;

  for (const user of users) {
    await createNotification(
      user._id,
      user.organizationId,
      'payment_overdue',
      title,
      message,
      link,
      { paymentId: payment._id, eventId: payment.eventId?._id }
    );
  }
};

/**
 * Create payment received notification
 */
const notifyPaymentReceived = async (payment, users) => {
  const title = 'Payment Received';
  const message = `Payment of ₹${payment.paidAmount.toLocaleString('en-IN')} received for ${payment.eventId?.eventName || 'event'}`;
  const link = `/events/${payment.eventId?._id}`;

  for (const user of users) {
    await createNotification(
      user._id,
      user.organizationId,
      'payment_received',
      title,
      message,
      link,
      { paymentId: payment._id, eventId: payment.eventId?._id }
    );
  }
};

/**
 * Create event upcoming notification (for PLANNER)
 */
const notifyEventUpcoming = async (event, planner) => {
  const eventDate = new Date(event.eventDate);
  const daysUntil = Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24));
  
  const title = 'Event Coming Up';
  const message = `${event.eventName} is scheduled for ${eventDate.toLocaleDateString('en-IN')}, ${daysUntil} days from now`;
  const link = `/events/${event._id}`;

  await createNotification(
    planner._id,
    planner.organizationId,
    'event_upcoming',
    title,
    message,
    link,
    { eventId: event._id }
  );
};

/**
 * Create team member joined notification
 */
const notifyTeamJoined = async (newMember, owner) => {
  const title = 'New Team Member';
  const message = `${newMember.name} joined your team as ${newMember.role.replace('_', ' ')}`;
  const link = '/team';

  await createNotification(
    owner._id,
    owner.organizationId,
    'team_joined',
    title,
    message,
    link,
    { userId: newMember._id }
  );
};

/**
 * Create event assigned notification (for PLANNER)
 */
const notifyEventAssigned = async (event, assignedUser) => {
  const title = `You've been assigned to ${event.eventName}`;
  const message = `You are now the lead planner for this event scheduled on ${new Date(event.eventDate).toLocaleDateString('en-IN')}`;
  const link = `/events/${event._id}`;

  await createNotification(
    assignedUser._id,
    assignedUser.organizationId,
    'event_assigned',
    title,
    message,
    link,
    { eventId: event._id }
  );
};

/**
 * Send manual notification based on role permissions
 */
const sendManualNotification = async (sender, title, message, link, taggedUserIds = []) => {
  try {
    // 1. Get all users in the organization
    const users = await User.find({ 
      organizationId: sender.organizationId,
      _id: { $ne: sender._id }, // Exclude sender
      isActive: true 
    });

    // 2. Filter recipients based on sender role
    let allowedRecipients = [];

    if (sender.role === 'PLANNER_OWNER') {
      // Owner can send to EVERYONE
      allowedRecipients = users;
    } else if (sender.role === 'PLANNER') {
      // Planner can send ONLY to FINANCE and COORDINATOR
      allowedRecipients = users.filter(u => 
        u.role === 'FINANCE' || u.role === 'COORDINATOR'
      );
    } else {
      throw new Error('You do not have permission to send notifications');
    }

    // 3. Apply Tagging Filter if provided
    let finalRecipients = allowedRecipients;
    if (taggedUserIds && taggedUserIds.length > 0) {
      finalRecipients = allowedRecipients.filter(u => taggedUserIds.includes(u._id.toString()));
    }

    if (finalRecipients.length === 0) {
      return { count: 0 };
    }

    // 4. Send notifications
    const notifications = finalRecipients.map(recipient => ({
      userId: recipient._id,
      organizationId: sender.organizationId,
      type: 'manual_alert',
      title,
      message,
      link,
      senderId: sender._id,
      senderRole: sender.role,
      isRead: false
    }));

    await Notification.insertMany(notifications);

    return { count: finalRecipients.length };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  notifyPaymentDue,
  notifyPaymentOverdue,
  notifyPaymentReceived,
  notifyEventUpcoming,
  notifyTeamJoined,
  notifyEventAssigned,
  sendManualNotification
};
