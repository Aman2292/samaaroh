const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access :eventId
const taskController = require('../controllers/taskController');

// Authentication already applied by parent route (eventRoutes.js)

// Event-specific task routes
router.post('/', taskController.createTask);
router.get('/', taskController.getTasks);

module.exports = router;
