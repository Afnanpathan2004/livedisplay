const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/constants');

// All routes require authentication
router.use(requireAuth);

// Get notifications for user
router.get('/', 
  requirePermission(PERMISSIONS.READ_NOTIFICATIONS),
  notificationController.getNotifications
);

// Get notification statistics
router.get('/stats', 
  requirePermission(PERMISSIONS.READ_NOTIFICATIONS),
  notificationController.getNotificationStats
);

// Mark notification as read
router.patch('/:id/read', 
  requirePermission(PERMISSIONS.READ_NOTIFICATIONS),
  notificationController.markAsRead
);

// Mark all notifications as read
router.patch('/read-all', 
  requirePermission(PERMISSIONS.READ_NOTIFICATIONS),
  notificationController.markAllAsRead
);

// Create notification (admin only)
router.post('/', 
  requirePermission(PERMISSIONS.CREATE_NOTIFICATIONS),
  notificationController.createNotification
);

// Send bulk notification
router.post('/bulk', 
  requirePermission(PERMISSIONS.CREATE_NOTIFICATIONS),
  notificationController.sendBulkNotification
);

// Delete notification
router.delete('/:id', 
  requirePermission(PERMISSIONS.DELETE_NOTIFICATIONS),
  notificationController.deleteNotification
);

module.exports = router;
