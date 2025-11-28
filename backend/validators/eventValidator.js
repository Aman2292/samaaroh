const { body, validationResult } = require('express-validator');

const validateEvent = [
  body('clientId')
    .trim()
    .notEmpty()
    .withMessage('Client is required')
    .isMongoId()
    .withMessage('Invalid client ID'),

  body('eventName')
    .trim()
    .notEmpty()
    .withMessage('Event name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Event name must be between 2 and 100 characters'),

  body('eventType')
    .trim()
    .notEmpty()
    .withMessage('Event type is required')
    .isIn(['wedding', 'birthday', 'corporate', 'anniversary', 'engagement', 'other'])
    .withMessage('Invalid event type'),

  body('eventDate')
    .notEmpty()
    .withMessage('Event date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const eventDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (eventDate < today) {
        throw new Error('Event date cannot be in the past');
      }
      return true;
    }),

  body('venue')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Venue must not exceed 200 characters'),

  body('estimatedBudget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated budget must be a positive number'),

  body('actualBudget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Actual budget must be a positive number'),

  body('status')
    .optional()
    .isIn(['lead', 'booked', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),

  body('leadPlannerId')
    .trim()
    .notEmpty()
    .withMessage('Lead planner is required')
    .isMongoId()
    .withMessage('Invalid lead planner ID'),

  body('assignedCoordinators')
    .optional()
    .isArray()
    .withMessage('Assigned coordinators must be an array'),

  body('assignedCoordinators.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid coordinator ID'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }
    next();
  }
];

const validateEventUpdate = [
  body('clientId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Client cannot be empty')
    .isMongoId()
    .withMessage('Invalid client ID'),

  body('eventName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Event name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Event name must be between 2 and 100 characters'),

  body('eventType')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Event type cannot be empty')
    .isIn(['wedding', 'birthday', 'corporate', 'anniversary', 'engagement', 'other'])
    .withMessage('Invalid event type'),

  body('eventDate')
    .optional()
    .notEmpty()
    .withMessage('Event date cannot be empty')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const eventDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Allow past dates for updates in case of corrections
      return true;
    }),

  body('venue')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Venue must not exceed 200 characters'),

  body('estimatedBudget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated budget must be a positive number'),

  body('actualBudget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Actual budget must be a positive number'),

  body('status')
    .optional()
    .isIn(['lead', 'booked', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),

  body('leadPlannerId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Lead planner cannot be empty')
    .isMongoId()
    .withMessage('Invalid lead planner ID'),

  body('assignedCoordinators')
    .optional()
    .isArray()
    .withMessage('Assigned coordinators must be an array'),

  body('assignedCoordinators.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid coordinator ID'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }
    next();
  }
];

module.exports = {
  validateEvent,
  validateEventUpdate
};
