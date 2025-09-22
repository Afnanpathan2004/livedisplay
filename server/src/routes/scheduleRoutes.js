const express = require('express');
const { authenticateToken, requirePermission, PERMISSIONS } = require('../utils/auth');
const { validateRequest, sanitizeInput, scheduleSchemas } = require('../middleware/validation');
const {
  getScheduleByDate,
  createScheduleEntry,
  updateScheduleEntry,
  deleteScheduleEntry
} = require('../controllers/scheduleController');

const router = express.Router();

// Apply sanitization to all routes
router.use(sanitizeInput);

// Public routes (for display)
router.get('/', getScheduleByDate);

// Protected routes
router.post('/', authenticateToken, requirePermission(PERMISSIONS.WRITE_SCHEDULE), validateRequest(scheduleSchemas.create), createScheduleEntry);
router.put('/:id', authenticateToken, requirePermission(PERMISSIONS.WRITE_SCHEDULE), validateRequest(scheduleSchemas.update), updateScheduleEntry);
router.delete('/:id', authenticateToken, requirePermission(PERMISSIONS.DELETE_SCHEDULE), deleteScheduleEntry);

module.exports = router;
