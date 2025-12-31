const Invoice = require('../models/Invoice');
const Organization = require('../models/Organization');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class InvoiceService {
  
  /**
   * Generate unique invoice number
   */
  async generateInvoiceNumber(organizationId) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Find last invoice for this organization
    const lastInvoice = await Invoice.findOne({ organizationId })
      .sort({ createdAt: -1 });
    
    let sequence = 1;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-').pop());
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }
    
    return `INV-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Calculate invoice totals
   */
  calculateTotals(items, taxRate, discount, discountType) {
    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    
    // Calculate discount amount
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (subtotal * discount) / 100;
    } else {
      discountAmount = discount;
    }
    
    // Calculate taxable amount
    const taxableAmount = subtotal - discountAmount;
    
    // Calculate tax
    const taxAmount = (taxableAmount * taxRate) / 100;
    
    // Calculate total
    const total = taxableAmount + taxAmount;
    
    return {
      subtotal,
      taxAmount,
      total
    };
  }

  /**
   * Create invoice
   */
  async createInvoice(data, userId, organizationId) {
    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(organizationId);
    
    // Calculate amounts for items
    const items = data.items.map(item => ({
      ...item,
      amount: item.quantity * item.unitPrice
    }));
    
    // Calculate totals
    const { subtotal, taxAmount, total } = this.calculateTotals(
      items,
      data.taxRate || 18,
      data.discount || 0,
      data.discountType || 'fixed'
    );
    
    // Create invoice
    const invoice = await Invoice.create({
      ...data,
      invoiceNumber,
      items,
      subtotal,
      taxAmount,
      total,
      balanceAmount: total,
      organizationId,
      createdBy: userId
    });
    
    return invoice;
  }

  /**
   * Get invoices with filters
   */
  async getInvoices(organizationId, filters = {}) {
    const query = { organizationId };
    
    if (filters.status) query.status = filters.status;
    if (filters.clientId) query.clientId = filters.clientId;
    if (filters.eventId) query.eventId = filters.eventId;
    
    if (filters.dateFrom || filters.dateTo) {
      query.invoiceDate = {};
      if (filters.dateFrom) query.invoiceDate.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.invoiceDate.$lte = new Date(filters.dateTo);
    }
    
    const invoices = await Invoice.find(query)
      .populate('clientId', 'name email phone')
      .populate('eventId', 'eventName eventDate')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    return invoices;
  }

  /**
   * Get single invoice
   */
  async getInvoiceById(invoiceId) {
    const invoice = await Invoice.findById(invoiceId)
      .populate('clientId', 'name email phone city')
      .populate('eventId', 'eventName eventDate')
      .populate('organizationId', 'name email phone address')
      .populate('createdBy', 'name email');
    
    return invoice;
  }

  /**
   * Update invoice
   */
  async updateInvoice(invoiceId, data) {
    // If items are being updated, recalculate totals
    if (data.items) {
      const items = data.items.map(item => ({
        ...item,
        amount: item.quantity * item.unitPrice
      }));
      
      const { subtotal, taxAmount, total } = this.calculateTotals(
        items,
        data.taxRate || 18,
        data.discount || 0,
        data.discountType || 'fixed'
      );
      
      data.items = items;
      data.subtotal = subtotal;
      data.taxAmount = taxAmount;
      data.total = total;
      data.balanceAmount = total - (data.paidAmount || 0);
    }
    
    const invoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      data,
      { new: true, runValidators: true }
    );
    
    return invoice;
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(invoiceId, status) {
    const updateData = { status };
    
    if (status === 'sent') {
      updateData.sentAt = new Date();
    } else if (status === 'paid') {
      updateData.paidAt = new Date();
      
      // Update balance amount
      const invoice = await Invoice.findById(invoiceId);
      updateData.paidAmount = invoice.total;
      updateData.balanceAmount = 0;
    }
    
    const invoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      updateData,
      { new: true }
    );
    
    // Sync with document
    try {
      const documentService = require('./documentService');
      await documentService.updateInvoiceDocumentMetadata(invoiceId, updateData);
    } catch (error) {
      console.error('Error updating document metadata:', error);
    }
    
    return invoice;
  }

  /**
   * Record payment
   */
  async recordPayment(invoiceId, amount) {
    const invoice = await Invoice.findById(invoiceId);
    
    if (!invoice) throw new Error('Invoice not found');
    
    const newPaidAmount = invoice.paidAmount + amount;
    const newBalanceAmount = invoice.total - newPaidAmount;
    
    let status = 'partial';
    if (newBalanceAmount <= 0) {
      status = 'paid';
    }
    
    invoice.paidAmount = newPaidAmount;
    invoice.balanceAmount = newBalanceAmount;
    invoice.status = status;
    
    if (status === 'paid') {
      invoice.paidAt = new Date();
    }
    
    await invoice.save();
    
    return invoice;
  }

  /**
   * Generate PDF invoice
   */
  async generatePDF(invoiceId) {
    const invoice = await this.getInvoiceById(invoiceId);
    
    if (!invoice) throw new Error('Invoice not found');
    
    const fileName = `invoice_${invoice.invoiceNumber}.pdf`;
    const filePath = path.join(__dirname, '../public/invoices', fileName);
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4'
    });
    const stream = fs.createWriteStream(filePath);
    
    doc.pipe(stream);
    
    // INVOICE Title - Big and Blue centered at top
    doc.fontSize(36)
       .fillColor('#2563eb')
       .font('Helvetica-Bold')
       .text('INVOICE', { align: 'center' });
    
    doc.moveDown(1);
    
    // Organization and Invoice Details Row
    const topY = doc.y;
   
    // Left side - Organization Details
    doc.fontSize(14)
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text(invoice.organizationId?.name || 'Organization', 50, topY);
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#374151')
       .text(invoice.organizationId?.email || '', 50, doc.y + 5);
    doc.text(invoice.organizationId?.phone || '', 50, doc.y + 2);
    
    // Right side - Invoice Details
    const rightX = 350;
    let rightY = topY;
    
    doc.fontSize(10).fillColor('#6b7280').font('Helvetica');
    doc.text('Invoice Number:', rightX, rightY);
    doc.fillColor('#000000').font('Helvetica-Bold').text(invoice.invoiceNumber, rightX + 120, rightY);
    
    rightY += 20;
    doc.fillColor('#6b7280').font('Helvetica').text('Invoice Date:', rightX, rightY);
    doc.fillColor('#000000').text(invoice.invoiceDate.toLocaleDateString('en-IN'), rightX + 120, rightY);
    
    rightY += 20;
    doc.fillColor('#6b7280').text('Due Date:', rightX, rightY);
    doc.fillColor('#000000').text(invoice.dueDate.toLocaleDateString('en-IN'), rightX + 120, rightY);
    
    // Status Badge
    rightY += 30;
    const statusColors = {
      draft: '#6b7280',
      sent: '#3b82f6',
      paid: '#10b981',
      partial: '#f59e0b',
      overdue: '#ef4444',
      cancelled: '#6b7280'
    };
    doc.roundedRect(rightX, rightY, 100, 25, 3)
       .fill(statusColors[invoice.status] || '#6b7280');
    doc.fillColor('#ffffff')
       .font('Helvetica-Bold')
       .fontSize(10)
       .text(invoice.status.toUpperCase(), rightX + 10, rightY + 7, { width: 80, align: 'center' });
    
    doc.moveDown(3);
    
    // Bill To Section with Blue Header
    const billToY = doc.y + 20;
    doc.fontSize(12)
       .fillColor('#2563eb')
       .font('Helvetica-Bold')
       .text('Bill To:', 50, billToY);
    
    doc.fontSize(11)
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text(invoice.clientId?.name || 'Client', 50, billToY + 25);
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#374151')
       .text(invoice.clientId?.phone || '', 50, doc.y + 3);
    
    if (invoice.clientId?.email) {
      doc.text(invoice.clientId.email, 50, doc.y + 2);
    }
    if (invoice.clientId?.city) {
      doc.text(invoice.clientId.city, 50, doc.y + 2);
    }
    
    if (invoice.eventId) {
      doc.moveDown(0.5);
      doc.fillColor('#6b7280').text('Event: ', 50, doc.y, { continued: true });
      doc.fillColor('#000000').font('Helvetica-Bold').text(invoice.eventId.eventName);
    }
    
    doc.moveDown(2);
    
    // Items Table
    const tableTop = doc.y + 10;
    
    // Table Header - Light gray background
    doc.rect(50, tableTop, 495, 30).fillAndStroke('#f3f4f6', '#e5e7eb');
    
    doc.fontSize(10).fillColor('#374151').font('Helvetica-Bold');
    doc.text('Description', 60, tableTop + 10, { width: 200 });
    doc.text('Qty', 280, tableTop + 10, { width: 50, align: 'center' });
    doc.text('Rate', 340, tableTop + 10, { width: 80, align: 'right' });
    doc.text('Amount', 430, tableTop + 10, { width: 105, align: 'right' });
    
    // Table Items
    let itemY = tableTop + 40;
    doc.font('Helvetica').fillColor('#000000');
    
    invoice.items.forEach((item, index) => {
      // Row background for better readability
      if (index % 2 === 0) {
        doc.rect(50, itemY - 5, 495, 30).fillAndStroke('#ffffff', '#e5e7eb');
      } else {
        doc.rect(50, itemY - 5, 495, 30).fillAndStroke('#fafafa', '#e5e7eb');
      }
      
      doc.fontSize(10).fillColor('#000000');
      doc.text(item.description, 60, itemY, { width: 210 });
      doc.text(item.quantity.toString(), 280, itemY, { width: 50, align: 'center' });
      doc.text(`₹${item.unitPrice.toLocaleString('en-IN')}`, 340, itemY, { width: 80, align: 'right' });
      doc.text(`₹${item.amount.toLocaleString('en-IN')}`, 430, itemY, { width: 105, align: 'right' });
      
      itemY += 30;
    });
    
    // Totals Section
    itemY += 30;
    const totalsX = 380;
    
    // Subtotal
    doc.fontSize(10).fillColor('#374151').font('Helvetica');
    doc.text('Subtotal:', totalsX, itemY);
    doc.fillColor('#000000').text(`₹${invoice.subtotal.toLocaleString('en-IN')}`, 450, itemY, { width: 90, align: 'right' });
    itemY += 20;
    
    // Discount
    if (invoice.discount > 0) {
      const discountLabel = invoice.discountType === 'percentage' 
        ? `Discount (${invoice.discount}%)` 
        : 'Discount';
      doc.fillColor('#374151').text(discountLabel + ':', totalsX, itemY);
      
      const discountAmount = invoice.discountType === 'percentage' 
        ? (invoice.subtotal * invoice.discount) / 100 
        : invoice.discount;
      doc.fillColor('#ef4444').text(`-₹${discountAmount.toLocaleString('en-IN')}`, 450, itemY, { width: 90, align: 'right' });
      itemY += 20;
    }
    
    // Tax
    doc.fillColor('#374151').text(`Tax (Vat ${invoice.taxRate}%):`, totalsX, itemY);
    doc.fillColor('#000000').text(`₹${invoice.taxAmount.toLocaleString('en-IN')}`, 450, itemY, { width: 90, align: 'right' });
    itemY += 25;
    
    // Divider line
    doc.moveTo(totalsX, itemY).lineTo(540, itemY).stroke('#d1d5db');
    itemY += 15;
    
    // Grand Total with yellow/golden background
    doc.roundedRect(totalsX - 10, itemY - 5, 170, 35, 5).fillAndStroke('#fbbf24', '#f59e0b');
    doc.fontSize(14).fillColor('#111827').font('Helvetica-Bold');
    doc.text('GRAND TOTAL', totalsX, itemY + 6);
    doc.fontSize(16).text(`₹${invoice.total.toLocaleString('en-IN')}`, 450, itemY + 5, { width: 90, align: 'right' });
    itemY += 50;
    
    // Payment Status if applicable
    if (invoice.paidAmount > 0) {
      doc.fontSize(10).fillColor('#374151').font('Helvetica');
      doc.text('Paid:', totalsX, itemY);
      doc.fillColor('#10b981').font('Helvetica-Bold').text(`₹${invoice.paidAmount.toLocaleString('en-IN')}`, 450, itemY, { width: 90, align: 'right' });
      itemY += 20;
      
      doc.fillColor('#374151').font('Helvetica-Bold').text('Balance Due:', totalsX, itemY);
      doc.fillColor('#f59e0b').text(`₹${invoice.balanceAmount.toLocaleString('en-IN')}`, 450, itemY, { width: 90, align: 'right' });
    }
    
    // Terms & Conditions
    if (invoice.terms) {
      doc.moveDown(3);
      doc.fontSize(11).fillColor('#111827').font('Helvetica-Bold').text('TERMS & CONDITIONS:', 50);
      doc.fontSize(9).fillColor('#4b5563').font('Helvetica').text(invoice.terms, 50, doc.y + 8, { 
        width: 490,
        lineGap: 2
      });
    }
    
    // Notes
    if (invoice.notes) {
      doc.moveDown(2);
      doc.fontSize(11).fillColor('#111827').font('Helvetica-Bold').text('NOTES:', 50);
      doc.fontSize(9).fillColor('#4b5563').font('Helvetica').text(invoice.notes, 50, doc.y + 8, { 
        width: 490,
        lineGap: 2
      });
    }
    
    // Footer - Thank you message
    const footerY = doc.page.height - 80;
    doc.fontSize(12).fillColor('#111827').font('Helvetica-Bold')
       .text('Thank you for your business!', 50, footerY, { align: 'center', width: 495 });
    
    doc.fontSize(8).fillColor('#9ca3af').font('Helvetica')
       .text(`Created by ${invoice.createdBy?.name} on ${invoice.createdAt.toLocaleDateString('en-IN')}`, 50, footerY + 20, { 
         align: 'center',
         width: 495  
       });
    
    doc.end();
    
    // Wait for PDF to be written
    await new Promise((resolve) => stream.on('finish', resolve));
    
    // Update invoice with PDF URL
    invoice.pdfUrl = `/invoices/${fileName}`;
    
    // Create document entry (if not already exists)
    try {
      const documentService = require('./documentService');
      const document = await documentService.createDocumentFromInvoice(invoice);
      
      // Link invoice to document
      invoice.documentId = document._id;
    } catch (error) {
      console.error('Error creating document for invoice:', error);
      // Continue even if document creation fails
    }
    
    await invoice.save();
    return `/invoices/${fileName}`;
  }

  /**
   * Delete invoice
   */
  async deleteInvoice(invoiceId) {
    const invoice = await Invoice.findByIdAndDelete(invoiceId);
    
    // Delete PDF file if exists
    if (invoice.pdfUrl) {
      const filePath = path.join(__dirname, '../public', invoice.pdfUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    return invoice;
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStats(organizationId) {
    const stats = await Invoice.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' }
        }
      }
    ]);
    
    const totalRevenue = await Invoice.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          paid: { $sum: '$paidAmount' },
          pending: { $sum: '$balanceAmount' }
        }
      }
    ]);
    
    return {
      statusBreakdown: stats,
      revenue: totalRevenue[0] || { total: 0, paid: 0, pending: 0 }
    };
  }
}

module.exports = new InvoiceService();
