const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/constants');

// All routes require authentication
router.use(requireAuth);

// Get all visitors with filtering
router.get('/', 
  requirePermission(PERMISSIONS.READ_VISITORS),
  visitorController.getAllVisitors
);

// Get visitor statistics
router.get('/stats', 
  requirePermission(PERMISSIONS.READ_VISITORS),
  visitorController.getVisitorStats
);

// Get visitor by ID
router.get('/:id', 
  requirePermission(PERMISSIONS.READ_VISITORS),
  visitorController.getVisitorById
);

// Register new visitor
router.post('/', 
  requirePermission(PERMISSIONS.CREATE_VISITORS),
  visitorController.registerVisitor
);

// Update visitor
router.put('/:id', 
  requirePermission(PERMISSIONS.UPDATE_VISITORS),
  visitorController.updateVisitor
);

// Approve/Reject visitor
router.patch('/:id/status', 
  requirePermission(PERMISSIONS.APPROVE_VISITORS),
  visitorController.updateVisitorStatus
);

// Check-in visitor
router.patch('/:id/checkin', 
  requirePermission(PERMISSIONS.UPDATE_VISITORS),
  visitorController.checkInVisitor
);

// Check-out visitor
router.patch('/:id/checkout', 
  requirePermission(PERMISSIONS.UPDATE_VISITORS),
  visitorController.checkOutVisitor
);

module.exports = router;
