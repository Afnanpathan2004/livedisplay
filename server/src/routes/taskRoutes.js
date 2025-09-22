const express = require('express');
const { authenticateToken, requirePermission, PERMISSIONS } = require('../utils/auth');
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  completeTask
} = require('../controllers/taskController');

const router = express.Router();

// Public routes (for display)
router.get('/', getTasks);
router.get('/:id', getTaskById);

// Protected routes
router.post('/', authenticateToken, requirePermission(PERMISSIONS.WRITE_TASKS), createTask);
router.put('/:id', authenticateToken, requirePermission(PERMISSIONS.WRITE_TASKS), updateTask);
router.delete('/:id', authenticateToken, requirePermission(PERMISSIONS.WRITE_TASKS), deleteTask);
router.patch('/:id/complete', authenticateToken, completeTask);

module.exports = router;
