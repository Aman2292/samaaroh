const { body, param, query } = require('express-validator');

/**
 * Validation for creating a payment
 */
const validateCreatePayment = [
  body('eventId')
    .notEmpty().withMessage('Event ID is required')
    .isMongoId().withMessage('Invalid event ID'),
  
  body('paymentType')
    .notEmpty().withMessage('Payment type is required')
    .isIn(['client_payment', 'vendor_payment']).withMessage('Invalid payment type'),
  
  body('description')
    .notEmpty().withMessage('Description is required')
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Description must be 3-200 characters'),
  
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  
  body('dueDate')
    .notEmpty().withMessage('Due date is required')
    .isISO8601().withMessage('Invalid date format'),
  
  // Conditional validation for client payments
  body('clientId')
    .if(body('paymentType').equals('client_payment'))
    .notEmpty().withMessage('Client ID is required for client payments')
    .isMongoId().withMessage('Invalid client ID'),
  
  // Conditional validation for vendor payments
  body('vendorName')
    .if(body('paymentType').equals('vendor_payment'))
    .notEmpty().withMessage('Vendor name is required for vendor payments')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Vendor name must be 2-100 characters'),
  
  body('vendorCategory')
    .if(body('paymentType').equals('vendor_payment'))
    .optional()
    .isIn(['catering', 'decoration', 'photography', 'videography', 'venue', 'dj', 'makeup', 'transport', 'other'])
    .withMessage('Invalid vendor category'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters')
];

/**
 * Validation for updating a payment
 */
const validateUpdatePayment = [
  param('id')
    .isMongoId().withMessage('Invalid payment ID'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Description must be 3-200 characters'),
  
  body('amount')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  
  body('vendorName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Vendor name must be 2-100 characters'),
  
  body('vendorCategory')
    .optional()
    .isIn(['catering', 'decoration', 'photography', 'videography', 'venue', 'dj', 'makeup', 'transport', 'other'])
    .withMessage('Invalid vendor category'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters')
];

/**
 * Validation for marking payment as paid
 */
const validateMarkPaid = [
  param('id')
    .isMongoId().withMessage('Invalid payment ID'),
  
  body('paidAmount')
    .notEmpty().withMessage('Paid amount is required')
    .isFloat({ min: 0.01 }).withMessage('Paid amount must be greater than 0'),
  
  body('paidDate')
    .notEmpty().withMessage('Payment date is required')
    .isISO8601().withMessage('Invalid date format'),
  
  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['cash', 'upi', 'bank_transfer', 'cheque', 'card', 'online'])
    .withMessage('Invalid payment method'),
  
  body('transactionReference')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Transaction reference must not exceed 100 characters'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters')
];

/**
 * Validation for getting event payments
 */
const validateGetEventPayments = [
  param('eventId')
    .isMongoId().withMessage('Invalid event ID')
];

/**
 * Validation for outstanding payments query
 */
const validateOutstandingQuery = [
  query('type')
    .optional()
    .isIn(['client', 'vendor']).withMessage('Type must be either client or vendor'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

module.exports = {
  validateCreatePayment,
  validateUpdatePayment,
  validateMarkPaid,
  validateGetEventPayments,
  validateOutstandingQuery
};
