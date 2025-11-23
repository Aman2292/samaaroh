const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');
const { scopeToOrganization, verifyOwnership } = require('../middleware/organizationMiddleware');
const { validateClient } = require('../validators/clientValidator');
const Client = require('../models/Client');

// Apply authentication and organization scoping to all routes
router.use(protect);
router.use(scopeToOrganization);

// Routes
router.post('/', validateClient, clientController.createClient);
router.get('/', clientController.getClients);
router.get('/:id', verifyOwnership(Client), clientController.getClient);
router.put('/:id', verifyOwnership(Client), validateClient, clientController.updateClient);
router.delete('/:id', verifyOwnership(Client), clientController.deleteClient);

module.exports = router;
