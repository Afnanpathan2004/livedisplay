const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/constants');

// All routes require authentication
router.use(requireAuth);

// Get leave requests with filtering
router.get('/', 
  requirePermission(PERMISSIONS.READ_LEAVES),
  leaveController.getLeaves
);

// Get leave balance for employee
router.get('/balance', 
  requirePermission(PERMISSIONS.READ_LEAVES),
  leaveController.getLeaveBalance
);

// Get leave statistics
router.get('/stats', 
  requirePermission(PERMISSIONS.READ_LEAVES),
  leaveController.getLeaveStats
);

// Apply for leave
router.post('/', 
  requirePermission(PERMISSIONS.CREATE_LEAVES),
  leaveController.applyLeave
);

// Approve/Reject leave
router.patch('/:id/status', 
  requirePermission(PERMISSIONS.APPROVE_LEAVES),
  leaveController.updateLeaveStatus
);

module.exports = router;
