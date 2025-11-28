const Payment = require('../models/Payment');
const Event = require('../models/Event');
const Client = require('../models/Client');

/**
 * Create a new payment
 */
const createPayment = async (paymentData, userId, organizationId) => {
  // Verify event exists and belongs to organization
  const event = await Event.findOne({
    _id: paymentData.eventId,
    organizationId,
    isActive: true
  });

  if (!event) {
    throw new Error('Event not found or does not belong to your organization');
  }

  // If client payment, verify client matches event and belongs to organization
  if (paymentData.paymentType === 'client_payment') {
    if (!paymentData.clientId) {
      throw new Error('Client ID is required for client payments');
    }

    const client = await Client.findOne({
      _id: paymentData.clientId,
      organizationId,
      isActive: true
    });

    if (!client) {
      throw new Error('Client not found or does not belong to your organization');
    }

    // Verify client matches event
    if (event.clientId.toString() !== paymentData.clientId.toString()) {
      throw new Error('Client does not match the event');
    }
  }

  // Create payment
  const payment = await Payment.create({
    ...paymentData,
    organizationId,
    createdBy: userId
  });

  return payment;
};

/**
 * Get all payments for an event
 */
const getEventPayments = async (eventId, organizationId, userRole) => {
  // Build event query
  const eventQuery = {
    _id: eventId,
    isActive: true
  };

  // Only filter by organization if not SUPER_ADMIN
  if (userRole !== 'SUPER_ADMIN' && organizationId) {
    eventQuery.organizationId = organizationId;
  }

  // Verify event exists
  const event = await Event.findOne(eventQuery);

  if (!event) {
    throw new Error('Event not found or does not belong to your organization');
  }

  // Build payments query
  const paymentsQuery = {
    eventId,
    isDeleted: false
  };

  // Only filter by organization if not SUPER_ADMIN
  if (userRole !== 'SUPER_ADMIN' && organizationId) {
    paymentsQuery.organizationId = organizationId;
  }

  // Fetch all payments for the event
  const payments = await Payment.find(paymentsQuery)
    .populate('clientId', 'name phone')
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name')
    .sort({ dueDate: 1 });

  // Group by payment type
  const clientPayments = payments.filter(p => p.paymentType === 'client_payment');
  const vendorPayments = payments.filter(p => p.paymentType === 'vendor_payment');

  // Calculate totals
  const clientTotal = clientPayments.reduce((sum, p) => sum + p.amount, 0);
  const clientPaid = clientPayments.reduce((sum, p) => sum + p.paidAmount, 0);
  const clientOutstanding = clientTotal - clientPaid;

  const vendorTotal = vendorPayments.reduce((sum, p) => sum + p.amount, 0);
  const vendorPaid = vendorPayments.reduce((sum, p) => sum + p.paidAmount, 0);
  const vendorOutstanding = vendorTotal - vendorPaid;

  return {
    clientPayments,
    vendorPayments,
    summary: {
      clientTotal,
      clientPaid,
      clientOutstanding,
      vendorTotal,
      vendorPaid,
      vendorOutstanding,
      netBalance: clientPaid - vendorPaid
    }
  };
};

/**
 * Get outstanding payments across organization
 */
const getOutstandingPayments = async (organizationId, filters = {}) => {
  const { type, page = 1, limit = 20 } = filters;

  // Build query
  const query = {
    organizationId,
    isDeleted: false,
    status: { $in: ['pending', 'partially_paid', 'overdue'] }
  };

  // Filter by payment type
  if (type === 'client') {
    query.paymentType = 'client_payment';
  } else if (type === 'vendor') {
    query.paymentType = 'vendor_payment';
  }

  // Pagination options
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { dueDate: 1, status: -1 }, // Overdue first, then by due date
    populate: [
      { path: 'eventId', select: 'eventName eventDate' },
      { path: 'clientId', select: 'name phone' },
      { path: 'createdBy', select: 'name' }
    ]
  };

  const result = await Payment.paginate(query, options);

  // Calculate summary
  const allOutstanding = await Payment.find(query);
  const totalOutstanding = allOutstanding.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);
  const overdueAmount = allOutstanding
    .filter(p => p.status === 'overdue')
    .reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

  return {
    payments: result.docs,
    pagination: {
      total: result.totalDocs,
      page: result.page,
      pages: result.totalPages,
      limit: result.limit
    },
    summary: {
      totalOutstanding,
      overdueAmount,
      overdueCount: allOutstanding.filter(p => p.status === 'overdue').length
    }
  };
};

/**
 * Get payment statistics for dashboard
 */
const getPaymentStats = async (organizationId) => {
  // Get all payments for the organization
  const allPayments = await Payment.find({
    organizationId,
    isDeleted: false
  });

  // Client payments stats
  const clientPayments = allPayments.filter(p => p.paymentType === 'client_payment');
  const totalExpected = clientPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalCollected = clientPayments.reduce((sum, p) => sum + p.paidAmount, 0);
  const outstandingAmount = totalExpected - totalCollected;

  // Vendor payments stats
  const vendorPayments = allPayments.filter(p => p.paymentType === 'vendor_payment');
  const vendorDue = vendorPayments
    .filter(p => p.status !== 'paid')
    .reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

  // Overdue payments
  const overduePayments = allPayments.filter(p => p.status === 'overdue');
  const overdueCount = overduePayments.length;
  const overdueAmount = overduePayments.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

  // Due this week
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const dueThisWeek = allPayments.filter(p => 
    p.status !== 'paid' && 
    p.dueDate >= today && 
    p.dueDate <= nextWeek
  );
  const dueThisWeekAmount = dueThisWeek.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

  return {
    totalExpected,
    totalCollected,
    outstandingAmount,
    vendorDue,
    overdueCount,
    overdueAmount,
    dueThisWeekCount: dueThisWeek.length,
    dueThisWeekAmount,
    collectionRate: totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(1) : 0
  };
};

/**
 * Mark payment as paid (full or partial)
 */
const markPaymentAsPaid = async (paymentId, paymentData, organizationId, userId) => {
  const payment = await Payment.findOne({
    _id: paymentId,
    organizationId,
    isDeleted: false
  });

  if (!payment) {
    throw new Error('Payment not found or does not belong to your organization');
  }

  // Validate paid amount
  const newTotalPaid = payment.paidAmount + paymentData.paidAmount;
  if (newTotalPaid > payment.amount) {
    throw new Error(`Paid amount cannot exceed total amount. Outstanding: ₹${payment.amount - payment.paidAmount}`);
  }

  // Update payment
  payment.paidAmount = newTotalPaid;
  payment.paidDate = paymentData.paidDate || new Date();
  payment.paymentMethod = paymentData.paymentMethod;
  payment.transactionReference = paymentData.transactionReference;
  
  // Append notes if provided
  if (paymentData.notes) {
    payment.notes = payment.notes 
      ? `${payment.notes}\n\n[${new Date().toLocaleDateString()}] ${paymentData.notes}`
      : paymentData.notes;
  }
  
  payment.updatedBy = userId;

  // Status will be auto-updated by pre-save hook
  await payment.save();

  return payment;
};

/**
 * Update payment details
 */
const updatePayment = async (paymentId, updateData, organizationId, userId) => {
  const payment = await Payment.findOne({
    _id: paymentId,
    organizationId,
    isDeleted: false
  });

  if (!payment) {
    throw new Error('Payment not found or does not belong to your organization');
  }

  // Update allowed fields
  const allowedUpdates = ['description', 'amount', 'dueDate', 'vendorName', 'vendorCategory', 'notes'];
  allowedUpdates.forEach(field => {
    if (updateData[field] !== undefined) {
      payment[field] = updateData[field];
    }
  });

  payment.updatedBy = userId;
  await payment.save();

  return payment;
};

/**
 * Delete payment (soft delete)
 */
const deletePayment = async (paymentId, organizationId) => {
  const payment = await Payment.findOne({
    _id: paymentId,
    organizationId,
    isDeleted: false
  });

  if (!payment) {
    throw new Error('Payment not found or does not belong to your organization');
  }

  payment.isDeleted = true;
  await payment.save();

  return payment;
};

/**
 * Send payment reminder
 */
const sendPaymentReminder = async (paymentId, organizationId) => {
  const payment = await Payment.findOne({
    _id: paymentId,
    organizationId,
    isDeleted: false
  })
    .populate('eventId', 'eventName')
    .populate('clientId', 'name phone');

  if (!payment) {
    throw new Error('Payment not found or does not belong to your organization');
  }

  // Update reminder tracking
  payment.reminderSent = true;
  payment.lastReminderDate = new Date();
  await payment.save();

  // TODO: Implement actual reminder sending (WhatsApp/Email/SMS)
  // For now, just return success
  return {
    success: true,
    message: 'Reminder sent successfully',
    payment
  };
};

/**
 * Auto-update overdue status (to be run as cron job)
 */
const autoUpdateOverdueStatus = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await Payment.updateMany(
    {
      status: 'pending',
      dueDate: { $lt: today },
      isDeleted: false
    },
    {
      $set: { status: 'overdue' }
    }
  );

  return {
    updated: result.modifiedCount
  };
};

module.exports = {
  createPayment,
  getEventPayments,
  getOutstandingPayments,
  getPaymentStats,
  markPaymentAsPaid,
  updatePayment,
  deletePayment,
  sendPaymentReminder,
  autoUpdateOverdueStatus
};
