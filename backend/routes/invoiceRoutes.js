const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { scopeToOrganization, requireRole } = require('../middleware/organizationMiddleware');
const invoiceController = require('../controllers/invoiceController');

// All routes require authentication
router.use(protect);

// All routes scoped to organization
router.use(scopeToOrganization);

// All routes require PLANNER_OWNER or FINANCE role
router.use(requireRole(['PLANNER_OWNER', 'FINANCE']));

// Statistics
router.get('/stats', invoiceController.getInvoiceStats);

// CRUD operations
router.post('/', invoiceController.createInvoice);
router.get('/', invoiceController.getInvoices);
router.get('/:id', invoiceController.getInvoice);
router.put('/:id', invoiceController.updateInvoice);
router.delete('/:id', requireRole(['PLANNER_OWNER']), invoiceController.deleteInvoice);

// PDF generation
router.post('/:id/generate-pdf', invoiceController.generatePDF);

// Email sending
router.post('/:id/send-email', invoiceController.sendEmail);

// Send invoice (mark as sent)
router.put('/:id/send', invoiceController.sendInvoice);

// Void invoice (PLANNER_OWNER only)
router.put('/:id/void', requireRole(['PLANNER_OWNER']), invoiceController.voidInvoice);

// Status updates
router.put('/:id/status', invoiceController.updateStatus);

// Payment recording
router.post('/:id/payment', invoiceController.recordPayment);

module.exports = router;
