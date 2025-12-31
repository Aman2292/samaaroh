const documentService = require('../services/documentService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only documents and images are allowed'));
    }
  }
});

/**
 * @route   POST /api/documents
 * @desc    Upload a new document
 * @access  Private
 */
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    const { category, entityType, entityId, description, tags, expiryDate, visibility } = req.body;
    
    if (!category || !entityType || !entityId) {
      return res.status(400).json({
        success: false,
        error: 'category, entityType, and entityId are required'
      });
    }
    
    const fileUrl = `/documents/${req.file.filename}`;
    
    const document = await documentService.createDocument({
      name: req.body.name || req.file.originalname,
      originalFileName: req.file.originalname,
      fileUrl,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      category,
      subcategory: req.body.subcategory,
      entityType,
      entityId,
      description,
      tags: tags ? JSON.parse(tags) : [],
      expiryDate,
      visibility: visibility || 'team'
    }, req.user._id, req.user.organizationId);
    
    res.status(201).json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/documents
 * @desc    Get all documents with filters
 * @access  Private
 */
const getDocuments = async (req, res, next) => {
  try {
    const { category, entityType, entityId, status, search, tags, limit } = req.query;
    
    const documents = await documentService.getDocuments(
      req.user.organizationId,
      { category, entityType, entityId, status, search, tags: tags ? tags.split(',') : null, limit }
    );
    
    res.json({
      success: true,
      count: documents.length,
      data: documents
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/documents/:id
 * @desc    Get single document by ID
 * @access  Private
 */
const getDocument = async (req, res, next) => {
  try {
    const document = await documentService.getDocumentById(req.params.id);
    
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/documents/:id
 * @desc    Update document metadata
 * @access  Private
 */
const updateDocument = async (req, res, next) => {
  try {
    const { name, description, tags, category, subcategory, status, expiryDate, visibility } = req.body;
    
    const document = await documentService.updateDocument(req.params.id, {
      name,
      description,
      tags,
      category,
      subcategory,
      status,
      expiryDate,
      visibility
    });
    
    res.json({
      success: true,
      data: document,
      message: 'Document updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/documents/:id
 * @desc    Delete document (soft delete)
 * @access  Private
 */
const deleteDocument = async (req, res, next) => {
  try {
    await documentService.deleteDocument(req.params.id);
    
    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/documents/:id/share
 * @desc    Share document with user/client
 * @access  Private
 */
const shareDocument = async (req, res, next) => {
  try {
    const { userId, email, accessLevel } = req.body;
    
    if (!userId && !email) {
      return res.status(400).json({
        success: false,
        error: 'Either userId or email is required'
      });
    }
    
    const document = await documentService.shareDocument(req.params.id, {
      userId,
      email,
      accessLevel: accessLevel || 'view'
    });
    
    res.json({
      success: true,
      data: document,
      message: 'Document shared successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/documents/expiring
 * @desc    Get expiring documents
 * @access  Private
 */
const getExpiringDocuments = async (req, res, next) => {
  try {
    const daysAhead = parseInt(req.query.days) || 30;
    
    const documents = await documentService.getExpiringDocuments(
      req.user.organizationId,
      daysAhead
    );
    
    res.json({
      success: true,
      count: documents.length,
      data: documents
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/documents/:id/version
 * @desc    Upload new version of document
 * @access  Private
 */
const uploadVersion = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    const fileUrl = `/documents/${req.file.filename}`;
    const { changeNote } = req.body;
    
    const document = await documentService.addVersion(
      req.params.id,
      fileUrl,
      req.file.size,
      changeNote,
      req.user._id
    );
    
    res.json({
      success: true,
      data: document,
      message: 'New version uploaded successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/documents/invoice/:invoiceId
 * @desc    Get document by invoice ID
 * @access  Private
 */
const getDocumentByInvoice = async (req, res, next) => {
  try {
    const document = await documentService.getDocumentByInvoiceId(req.params.invoiceId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found for this invoice'
      });
    }
    
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument: [upload.single('file'), uploadDocument],
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  shareDocument,
  getExpiringDocuments,
  uploadVersion: [upload.single('file'), uploadVersion],
  getDocumentByInvoice
};
