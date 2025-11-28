const paymentService = require('../services/paymentService');

/**
 * @route   POST /api/payments
 * @desc    Create a new payment
 * @access  Private (PLANNER_OWNER, PLANNER, FINANCE)
 */
const createPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.createPayment(
      req.body,
      req.user._id,
      req.user.organizationId
    );

    res.status(201).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/payments/event/:eventId
 * @desc    Get all payments for an event
 * @access  Private
 */
const getEventPayments = async (req, res, next) => {
  try {
    const result = await paymentService.getEventPayments(
      req.params.eventId,
      req.user.organizationId,
      req.user.role
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/payments/outstanding
 * @desc    Get all outstanding payments
 * @access  Private (PLANNER_OWNER, FINANCE)
 */
const getOutstandingPayments = async (req, res, next) => {
  try {
    const { type, page, limit } = req.query;

    const result = await paymentService.getOutstandingPayments(
      req.user.organizationId,
      { type, page, limit }
    );

    res.json({
      success: true,
      data: result.payments,
      pagination: result.pagination,
      summary: result.summary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/payments/stats
 * @desc    Get payment statistics for dashboard
 * @access  Private (PLANNER_OWNER, FINANCE)
 */
const getPaymentStats = async (req, res, next) => {
  try {
    const stats = await paymentService.getPaymentStats(req.user.organizationId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/payments/:id/mark-paid
 * @desc    Mark payment as paid (full or partial)
 * @access  Private (PLANNER_OWNER, PLANNER, FINANCE)
 */
const markPaymentAsPaid = async (req, res, next) => {
  try {
    const payment = await paymentService.markPaymentAsPaid(
      req.params.id,
      req.body,
      req.user.organizationId,
      req.user._id
    );

    res.json({
      success: true,
      data: payment,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/payments/:id
 * @desc    Update payment details
 * @access  Private (PLANNER_OWNER, PLANNER)
 */
const updatePayment = async (req, res, next) => {
  try {
    const payment = await paymentService.updatePayment(
      req.params.id,
      req.body,
      req.user.organizationId,
      req.user._id
    );

    res.json({
      success: true,
      data: payment,
      message: 'Payment updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/payments/:id
 * @desc    Delete payment (soft delete)
 * @access  Private (PLANNER_OWNER only)
 */
const deletePayment = async (req, res, next) => {
  try {
    await paymentService.deletePayment(
      req.params.id,
      req.user.organizationId
    );

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/payments/:id/send-reminder
 * @desc    Send payment reminder
 * @access  Private (PLANNER_OWNER, FINANCE)
 */
const sendPaymentReminder = async (req, res, next) => {
  try {
    const result = await paymentService.sendPaymentReminder(
      req.params.id,
      req.user.organizationId
    );

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  getEventPayments,
  getOutstandingPayments,
  getPaymentStats,
  markPaymentAsPaid,
  updatePayment,
  deletePayment,
  sendPaymentReminder
};
