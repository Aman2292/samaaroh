const Document = require('../models/Document');
const Invoice = require('../models/Invoice');
const fs = require('fs');
const path = require('path');

class DocumentService {
  
  /**
   * Create a new document
   */
  async createDocument(docData, userId, organizationId) {
    const document = await Document.create({
      ...docData,
      organizationId,
      uploadedBy: userId
    });
    
    return document;
  }
  
  /**
   * Create document from invoice
   */
  async createDocumentFromInvoice(invoice) {
    // Check if document already exists
    const existing = await Document.findOne({ invoiceId: invoice._id });
    if (existing) {
      return existing;
    }
    
    // Get file size if PDF exists
    let fileSize = null;
    if (invoice.pdfUrl) {
      const filePath = path.join(__dirname, '../public', invoice.pdfUrl);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        fileSize = stats.size;
      }
    }
    
    const document = await Document.create({
      organizationId: invoice.organizationId,
      entityType: 'invoice',
      entityId: invoice.clientId,
      invoiceId: invoice._id,
      
      name: `Invoice ${invoice.invoiceNumber}`,
      originalFileName: `invoice_${invoice.invoiceNumber}.pdf`,
      fileUrl: invoice.pdfUrl,
      fileSize,
      mimeType: 'application/pdf',
      
      category: 'invoice',
      subcategory: 'client_invoice',
      tags: ['invoice', invoice.status],
      
      invoiceMetadata: {
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        amount: invoice.total,
        status: invoice.status,
        paidAmount: invoice.paidAmount,
        balanceAmount: invoice.balanceAmount
      },
      
      uploadedBy: invoice.createdBy,
      uploadedAt: invoice.createdAt,
      visibility: 'client'
    });
    
    return document;
  }
  
  /**
   * Get documents with filters
   */
  async getDocuments(organizationId, filters = {}) {
    const query = { organizationId, isActive: true };
    
    if (filters.category) query.category = filters.category;
    if (filters.entityType) query.entityType = filters.entityType;
    if (filters.entityId) query.entityId = filters.entityId;
    if (filters.status) query.status = filters.status;
    
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { 'invoiceMetadata.invoiceNumber': { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }
    
    const documents = await Document.find(query)
      .populate('uploadedBy', 'name email')
      .populate('invoiceId', 'invoiceNumber status total')
      .sort({ createdAt: -1 })
      .limit(filters.limit || 100);
    
    return documents;
  }
  
  /**
   * Get single document
   */
  async getDocumentById(documentId) {
    const document = await Document.findById(documentId)
      .populate('uploadedBy', 'name email')
      .populate('invoiceId', 'invoiceNumber status total clientId eventId')
      .populate('sharedWith.userId', 'name email');
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Increment view count
    document.viewCount += 1;
    document.lastViewedAt = new Date();
    await document.save();
    
    return document;
  }
  
  /**
   * Update document metadata
   */
  async updateDocument(documentId, updateData) {
    const document = await Document.findByIdAndUpdate(
      documentId,
      updateData,
      { new: true, runValidators: true }
    );
    
    return document;
  }
  
  /**
   * Delete document (soft delete)
   */
  async deleteDocument(documentId) {
    const document = await Document.findByIdAndUpdate(
      documentId,
      { isActive: false },
      { new: true }
    );
    
    return document;
  }
  
  /**
   * Share document with user/client
   */
  async shareDocument(documentId, shareData) {
    const document = await Document.findById(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Add to sharedWith array
    document.sharedWith.push({
      userId: shareData.userId,
      email: shareData.email,
      accessLevel: shareData.accessLevel || 'view',
      sharedAt: new Date()
    });
    
    await document.save();
    
    return document;
  }
  
  /**
   * Get expiring documents
   */
  async getExpiringDocuments(organizationId, daysAhead = 30) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    const documents = await Document.find({
      organizationId,
      isActive: true,
      expiryDate: {
        $gte: now,
        $lte: futureDate
      }
    })
      .populate('uploadedBy', 'name')
      .sort({ expiryDate: 1 });
    
    return documents;
  }
  
  /**
   * Add new version to document
   */
  async addVersion(documentId, fileUrl, fileSize, changeNote, userId) {
    const document = await Document.findById(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    const newVersion = document.version + 1;
    
    // Add to versions array
    document.versions.push({
      versionNumber: newVersion,
      fileUrl,
      uploadedBy: userId,
      changeNote,
      fileSize
    });
    
    // Update current version
    document.version = newVersion;
    document.fileUrl = fileUrl;
    document.fileSize = fileSize;
    
    await document.save();
    
    return document;
  }
  
  /**
   * Get documents by invoice ID
   */
  async getDocumentByInvoiceId(invoiceId) {
    const document = await Document.findOne({ invoiceId })
      .populate('uploadedBy', 'name email')
      .populate('invoiceId', 'invoiceNumber status total');
    
    return document;
  }
  
  /**
   * Update invoice document metadata when invoice changes
   */
  async updateInvoiceDocumentMetadata(invoiceId, invoiceData) {
    const document = await Document.findOne({ invoiceId });
    
    if (!document) {
      return null;
    }
    
    // Update invoice metadata
    if (invoiceData.status) {
      document.invoiceMetadata.status = invoiceData.status;
      
      // Update tags
      const statusTags = ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'];
      document.tags = document.tags.filter(tag => !statusTags.includes(tag));
      document.tags.push(invoiceData.status);
    }
    
    if (invoiceData.paidAmount !== undefined) {
      document.invoiceMetadata.paidAmount = invoiceData.paidAmount;
    }
    
    if (invoiceData.balanceAmount !== undefined) {
      document.invoiceMetadata.balanceAmount = invoiceData.balanceAmount;
    }
    
    await document.save();
    
    return document;
  }
}

module.exports = new DocumentService();
