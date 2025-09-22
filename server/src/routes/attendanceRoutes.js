const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/constants');

// All routes require authentication
router.use(requireAuth);

// Get attendance records with filtering
router.get('/', 
  requirePermission(PERMISSIONS.READ_ATTENDANCE),
  attendanceController.getAttendance
);

// Get attendance summary for employee
router.get('/summary', 
  requirePermission(PERMISSIONS.READ_ATTENDANCE),
  attendanceController.getAttendanceSummary
);

// Get department attendance statistics
router.get('/department-stats', 
  requirePermission(PERMISSIONS.READ_ATTENDANCE),
  attendanceController.getDepartmentAttendanceStats
);

// Record check-in
router.post('/checkin', 
  requirePermission(PERMISSIONS.MARK_ATTENDANCE),
  attendanceController.checkIn
);

// Record check-out
router.post('/checkout', 
  requirePermission(PERMISSIONS.MARK_ATTENDANCE),
  attendanceController.checkOut
);

module.exports = router;
