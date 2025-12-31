const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// All document routes require authentication
router.use(protect);

// Upload new document
router.post('/', documentController.uploadDocument);

// Get all documents (with filters)
router.get('/', documentController.getDocuments);

// Get expiring documents
router.get('/expiring', documentController.getExpiringDocuments);

// Get document by invoice ID
router.get('/invoice/:invoiceId', documentController.getDocumentByInvoice);

// Get single document
router.get('/:id', documentController.getDocument);

// Update document metadata
router.put('/:id', documentController.updateDocument);

// Delete document
router.delete('/:id', documentController.deleteDocument);

// Share document
router.post('/:id/share', documentController.shareDocument);

// Upload new version
router.post('/:id/version', documentController.uploadVersion);

module.exports = router;
