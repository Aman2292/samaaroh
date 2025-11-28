const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/organizationMiddleware');
const {
  validateCreatePayment,
  validateUpdatePayment,
  validateMarkPaid,
  validateGetEventPayments,
  validateOutstandingQuery
} = require('../validators/paymentValidator');

// All routes require authentication
router.use(protect);

// Create payment (PLANNER_OWNER, PLANNER, FINANCE)
router.post(
  '/',
  requireRole(['PLANNER_OWNER', 'PLANNER', 'FINANCE']),
  validateCreatePayment,
  paymentController.createPayment
);

// Get event payments
router.get(
  '/event/:eventId',
  validateGetEventPayments,
  paymentController.getEventPayments
);

// Get outstanding payments (PLANNER_OWNER, FINANCE)
router.get('/outstanding', requireRole(['PLANNER_OWNER', 'FINANCE']), paymentController.getOutstandingPayments);

// Get payment statistics (PLANNER_OWNER, FINANCE)
router.get(
  '/stats',
  requireRole(['PLANNER_OWNER', 'FINANCE']),
  paymentController.getPaymentStats
);

// Mark payment as paid (PLANNER_OWNER, PLANNER, FINANCE)
router.put(
  '/:id/mark-paid',
  requireRole(['PLANNER_OWNER', 'PLANNER', 'FINANCE']),
  validateMarkPaid,
  paymentController.markPaymentAsPaid
);

// Send payment reminder (PLANNER_OWNER, FINANCE)
router.post(
  '/:id/send-reminder',
  requireRole(['PLANNER_OWNER', 'FINANCE']),
  paymentController.sendPaymentReminder
);

// Update payment (PLANNER_OWNER, PLANNER)
router.put(
  '/:id',
  requireRole(['PLANNER_OWNER', 'PLANNER']),
  validateUpdatePayment,
  paymentController.updatePayment
);

// Delete payment (PLANNER_OWNER only)
router.delete(
  '/:id',
  requireRole(['PLANNER_OWNER']),
  paymentController.deletePayment
);

module.exports = router;
