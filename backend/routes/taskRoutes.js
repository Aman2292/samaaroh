const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
    createTask,
    getTasks,
    getTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    getTaskStats
} = require('../controllers/taskController');

// Apply protect middleware to all routes
router.use(protect);

// Task statistics
router.get('/stats', getTaskStats);

// Task CRUD routes
router.route('/')
    .get(getTasks)
    .post(restrictTo('PLANNER_OWNER', 'PLANNER'), createTask);

router.route('/:id')
    .get(getTask)
    .put(updateTask)
    .delete(deleteTask);

// Update task status
router.patch('/:id/status', updateTaskStatus);

module.exports = router;
