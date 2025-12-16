const invoiceService = require('../services/invoiceService');
const Invoice = require('../models/Invoice');
const { logActivity } = require('../utils/activityLogger');

/**
 * @route   POST /api/invoices
 * @desc    Create invoice
 * @access  Private (PLANNER_OWNER, FINANCE)
 */
exports.createInvoice = async (req, res, next) => {
  try {
    const invoice = await invoiceService.createInvoice(
      req.body,
      req.user._id,
      req.user.organizationId
    );

    // Log activity
    await logActivity(
      req.user._id,
      req.user.role,
      'create_invoice',
      'invoice',
      invoice._id,
      invoice.invoiceNumber,
      { total: invoice.total, client: invoice.clientId },
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown',
      req.user.organizationId
    );

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/invoices
 * @desc    Get all invoices
 * @access  Private (PLANNER_OWNER, FINANCE)
 */
exports.getInvoices = async (req, res, next) => {
  try {
    const { status, clientId, eventId, dateFrom, dateTo } = req.query;
    
    const invoices = await invoiceService.getInvoices(
      req.user.organizationId,
      { status, clientId, eventId, dateFrom, dateTo }
    );

    res.json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/invoices/stats
 * @desc    Get invoice statistics
 * @access  Private (PLANNER_OWNER, FINANCE)
 */
exports.getInvoiceStats = async (req, res, next) => {
  try {
    const stats = await invoiceService.getInvoiceStats(req.user.organizationId);

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/invoices/:id
 * @desc    Get single invoice
 * @access  Private (PLANNER_OWNER, FINANCE)
 */
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    // Verify organization access
    // Handle both populated (object) and non-populated (ObjectId) organizationId
    const invoiceOrgId = invoice.organizationId._id || invoice.organizationId;
    if (invoiceOrgId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/invoices/:id
 * @desc    Update invoice
 * @access  Private (PLANNER_OWNER, FINANCE)
 */
exports.updateInvoice = async (req, res, next) => {
  try {
    const invoice = await invoiceService.updateInvoice(req.params.id, req.body);

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    // Log activity
    await logActivity(
      req.user._id,
      req.user.role,
      'update_invoice',
      'invoice',
      invoice._id,
      invoice.invoiceNumber,
      { updatedFields: Object.keys(req.body) },
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown',
      req.user.organizationId
    );

    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/invoices/:id
 * @desc    Delete invoice
 * @access  Private (PLANNER_OWNER only)
 */
exports.deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await invoiceService.deleteInvoice(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    // Log activity
    await logActivity(
      req.user._id,
      req.user.role,
      'delete_invoice',
      'invoice',
      invoice._id,
      invoice.invoiceNumber,
      {},
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown',
      req.user.organizationId
    );

    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/invoices/:id/generate-pdf
 * @desc    Generate PDF for invoice
 * @access  Private (PLANNER_OWNER, FINANCE)
 */
exports.generatePDF = async (req, res, next) => {
  try {
    const pdfUrl = await invoiceService.generatePDF(req.params.id);

    res.json({ success: true, data: { pdfUrl } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/invoices/:id/status
 * @desc    Update invoice status
 * @access  Private (PLANNER_OWNER, FINANCE)
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    const invoice = await invoiceService.updateInvoiceStatus(req.params.id, status);

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    // Log activity
    await logActivity(
      req.user._id,
      req.user.role,
      'update_invoice_status',
      'invoice',
      invoice._id,
      invoice.invoiceNumber,
      { newStatus: status },
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown',
      req.user.organizationId
    );

    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/invoices/:id/payment
 * @desc    Record payment for invoice
 * @access  Private (PLANNER_OWNER, FINANCE)
 */
exports.recordPayment = async (req, res, next) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid payment amount required' });
    }
    
    const invoice = await invoiceService.recordPayment(req.params.id, amount);

    // Log activity
    await logActivity(
      req.user._id,
      req.user.role,
      'record_invoice_payment',
      'invoice',
      invoice._id,
      invoice.invoiceNumber,
      { amount, newBalance: invoice.balanceAmount },
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown',
      req.user.organizationId
    );

    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/invoices/:id/send-email
 * @desc    Send invoice via email
 * @access  Private (PLANNER_OWNER, FINANCE)
 */
exports.sendEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address required' });
    }

    // Get invoice with populated data
    const invoice = await invoiceService.getInvoiceById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    // Generate PDF first
    const pdfUrl = await invoiceService.generatePDF(req.params.id);
    const path = require('path');
    const pdfPath = path.join(__dirname, '../public', pdfUrl);

    // Send email
    const emailService = require('../services/emailService');
    await emailService.sendInvoiceEmail(invoice, email, pdfPath);

    // Update invoice status to sent if it was draft
    if (invoice.status === 'draft') {
      await invoiceService.updateInvoiceStatus(req.params.id, 'sent');
    }

    // Log activity
    await logActivity(
      req.user._id,
      req.user.role,
      'send_invoice_email',
      'invoice',
      invoice._id,
      invoice.invoiceNumber,
      { sentTo: email },
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown',
      req.user.organizationId
    );

    res.json({ success: true, message: 'Invoice sent successfully' });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    next(error);
  }
};

/**
 * @route   PUT /api/invoices/:id/send
 * @desc    Mark invoice as sent (update status to 'sent')
 * @access  Private (PLANNER_OWNER, FINANCE)
 */
exports.sendInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    // Verify organization access
    const invoiceOrgId = invoice.organizationId._id || invoice.organizationId;
    if (invoiceOrgId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Update status to sent
    invoice.status = 'sent';
    invoice.sentAt = new Date();
    await invoice.save();

    // Log activity
    await logActivity(
      req.user._id,
      req.user.role,
      'send_invoice',
      'invoice',
      invoice._id,
      invoice.invoiceNumber,
      { status: 'sent' },
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown',
      req.user.organizationId
    );

    res.json({ success: true, message: 'Invoice marked as sent', data: invoice });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/invoices/:id/void
 * @desc    Void/cancel an invoice
 * @access  Private (PLANNER_OWNER only)
 */
exports.voidInvoice = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    // Verify organization access
    const invoiceOrgId = invoice.organizationId._id || invoice.organizationId;
    if (invoiceOrgId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Only PLANNER_OWNER can void invoices
    if (req.user.role !== 'PLANNER_OWNER') {
      return res.status(403).json({ success: false, error: 'Only organization owners can void invoices' });
    }

    // Cannot void already paid invoices
    if (invoice.status === 'paid') {
      return res.status(400).json({ success: false, error: 'Cannot void a paid invoice' });
    }

    // Update status to cancelled
    invoice.status = 'cancelled';
    invoice.voidedAt = new Date();
    invoice.voidReason = reason || 'No reason provided';
    await invoice.save();

    // Log activity
    await logActivity(
      req.user._id,
      req.user.role,
      'void_invoice',
      'invoice',
      invoice._id,
      invoice.invoiceNumber,
      { reason: invoice.voidReason },
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown',
      req.user.organizationId
    );

    res.json({ success: true, message: 'Invoice voided successfully', data: invoice });
  } catch (error) {
    next(error);
  }
};
