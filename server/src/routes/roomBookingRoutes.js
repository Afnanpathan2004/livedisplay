const express = require('express');
const router = express.Router();
const roomBookingController = require('../controllers/roomBookingController');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/constants');

// All routes require authentication
router.use(requireAuth);

// Get all bookings with filtering
router.get('/', 
  requirePermission(PERMISSIONS.READ_BOOKINGS),
  roomBookingController.getAllBookings
);

// Get booking statistics
router.get('/stats', 
  requirePermission(PERMISSIONS.READ_BOOKINGS),
  roomBookingController.getBookingStats
);

// Get room availability
router.get('/availability', 
  requirePermission(PERMISSIONS.READ_BOOKINGS),
  roomBookingController.getRoomAvailability
);

// Get booking by ID
router.get('/:id', 
  requirePermission(PERMISSIONS.READ_BOOKINGS),
  roomBookingController.getBookingById
);

// Create new booking
router.post('/', 
  requirePermission(PERMISSIONS.CREATE_BOOKINGS),
  roomBookingController.createBooking
);

// Update booking
router.put('/:id', 
  requirePermission(PERMISSIONS.UPDATE_BOOKINGS),
  roomBookingController.updateBooking
);

// Approve/Reject booking
router.patch('/:id/status', 
  requirePermission(PERMISSIONS.APPROVE_BOOKINGS),
  roomBookingController.updateBookingStatus
);

// Cancel booking
router.delete('/:id', 
  requirePermission(PERMISSIONS.DELETE_BOOKINGS),
  roomBookingController.cancelBooking
);

module.exports = router;
