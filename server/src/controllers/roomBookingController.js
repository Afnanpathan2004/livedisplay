const enterpriseDb = require('../utils/enterpriseDb');
const { logger } = require('../utils/logger');

// Get all room bookings with filtering
exports.getAllBookings = async (req, res, next) => {
  try {
    const { roomId, employeeId, status, date, buildingId } = req.query;
    const filters = {};
    
    if (roomId) filters.roomId = roomId;
    if (employeeId) filters.employeeId = employeeId;
    if (status) filters.status = status;
    if (date) filters.date = date;
    
    let bookings = await enterpriseDb.bookings.findAll(filters);
    
    // Filter by building if specified
    if (buildingId) {
      const rooms = await enterpriseDb.rooms.findAll({ buildingId });
      const roomIds = rooms.map(room => room.id);
      bookings = bookings.filter(booking => roomIds.includes(booking.roomId));
    }
    
    // Enrich with room and employee details
    const enrichedBookings = await Promise.all(bookings.map(async (booking) => {
      const room = await enterpriseDb.rooms.findById(booking.roomId);
      const employee = await enterpriseDb.employees.findById(booking.employeeId);
      const approver = booking.approvedBy ? 
        await enterpriseDb.employees.findById(booking.approvedBy) : null;
      
      return {
        ...booking,
        room: room ? {
          name: room.name,
          roomNumber: room.roomNumber,
          type: room.type,
          capacity: room.capacity,
          buildingId: room.buildingId,
          floorId: room.floorId
        } : null,
        employee: employee ? {
          name: `${employee.firstName} ${employee.lastName}`,
          employeeId: employee.employeeId,
          department: employee.department
        } : null,
        approver: approver ? {
          name: `${approver.firstName} ${approver.lastName}`,
          employeeId: approver.employeeId
        } : null
      };
    }));
    
    res.json({
      bookings: enrichedBookings,
      total: enrichedBookings.length,
      filters: { roomId, employeeId, status, date, buildingId }
    });
    
    logger.info('Room bookings retrieved', {
      userId: req.user.id,
      count: enrichedBookings.length,
      filters
    });
  } catch (error) {
    next(error);
  }
};

// Get booking by ID
exports.getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await enterpriseDb.bookings.findById(id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Check permissions
    if (req.user.role !== 'admin' && req.user.id !== booking.employeeId) {
      const room = await enterpriseDb.rooms.findById(booking.roomId);
      if (!room || !room.approvers.includes(req.user.id)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }
    
    // Enrich with details
    const room = await enterpriseDb.rooms.findById(booking.roomId);
    const employee = await enterpriseDb.employees.findById(booking.employeeId);
    
    res.json({
      ...booking,
      room,
      employee: employee ? {
        name: `${employee.firstName} ${employee.lastName}`,
        employeeId: employee.employeeId,
        department: employee.department,
        email: employee.email,
        phone: employee.phone
      } : null
    });
    
    logger.info('Booking details retrieved', {
      userId: req.user.id,
      bookingId: id
    });
  } catch (error) {
    next(error);
  }
};

// Create new room booking
exports.createBooking = async (req, res, next) => {
  try {
    const bookingData = {
      ...req.body,
      employeeId: req.user.id
    };
    
    // Validate room exists and is bookable
    const room = await enterpriseDb.rooms.findById(bookingData.roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    if (!room.isBookable) {
      return res.status(400).json({ error: 'Room is not available for booking' });
    }
    
    // Check for conflicts
    const existingBookings = await enterpriseDb.bookings.findAll({
      roomId: bookingData.roomId,
      status: 'approved'
    });
    
    const startTime = new Date(bookingData.startTime);
    const endTime = new Date(bookingData.endTime);
    
    const hasConflict = existingBookings.some(booking => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      
      return (startTime < bookingEnd && endTime > bookingStart);
    });
    
    if (hasConflict) {
      return res.status(409).json({ 
        error: 'Room is already booked for the selected time slot' 
      });
    }
    
    // Calculate cost
    const duration = (endTime - startTime) / (1000 * 60 * 60); // hours
    bookingData.cost = duration * (room.hourlyRate || 0);
    
    // Set initial status
    bookingData.status = room.requiresApproval ? 'pending' : 'approved';
    if (!room.requiresApproval) {
      bookingData.approvedBy = req.user.id;
      bookingData.approvalDate = new Date();
    }
    
    const booking = await enterpriseDb.bookings.create(bookingData);
    
    // Send notification to approvers if approval required
    if (room.requiresApproval && room.approvers.length > 0) {
      await enterpriseDb.notifications.create({
        type: 'booking',
        title: 'New Room Booking Request',
        message: `${req.user.firstName} ${req.user.lastName} has requested to book ${room.name} from ${startTime.toLocaleString()} to ${endTime.toLocaleString()}`,
        recipientType: 'individual',
        recipients: room.approvers,
        senderId: req.user.id,
        priority: 'medium',
        channels: ['email', 'push']
      });
    }
    
    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        ...booking,
        room: {
          name: room.name,
          roomNumber: room.roomNumber,
          requiresApproval: room.requiresApproval
        }
      }
    });
    
    logger.info('Room booking created', {
      userId: req.user.id,
      bookingId: booking.id,
      roomId: booking.roomId,
      requiresApproval: room.requiresApproval
    });
  } catch (error) {
    next(error);
  }
};

// Update booking (mainly for approval/rejection)
exports.updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const booking = await enterpriseDb.bookings.findById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const room = await enterpriseDb.rooms.findById(booking.roomId);
    
    // Check permissions
    const canUpdate = req.user.role === 'admin' || 
                     req.user.id === booking.employeeId ||
                     (room && room.approvers.includes(req.user.id));
    
    if (!canUpdate) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Handle approval/rejection
    if (updateData.status === 'approved' || updateData.status === 'rejected') {
      if (req.user.id === booking.employeeId) {
        return res.status(400).json({ error: 'Cannot approve your own booking' });
      }
      
      updateData.approvedBy = req.user.id;
      updateData.approvalDate = new Date();
      
      // Send notification to booking creator
      const employee = await enterpriseDb.employees.findById(booking.employeeId);
      if (employee) {
        await enterpriseDb.notifications.create({
          type: 'booking',
          title: `Booking ${updateData.status}`,
          message: `Your booking for ${room.name} has been ${updateData.status}${updateData.rejectionReason ? ': ' + updateData.rejectionReason : ''}`,
          recipientType: 'individual',
          recipients: [booking.employeeId],
          senderId: req.user.id,
          priority: 'medium',
          channels: ['email', 'push']
        });
      }
    }
    
    const updatedBooking = await enterpriseDb.bookings.update(id, updateData);
    
    res.json({
      message: 'Booking updated successfully',
      booking: updatedBooking
    });
    
    logger.info('Booking updated', {
      userId: req.user.id,
      bookingId: id,
      status: updateData.status,
      updatedFields: Object.keys(updateData)
    });
  } catch (error) {
    next(error);
  }
};

// Cancel booking
exports.cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const booking = await enterpriseDb.bookings.findById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Check permissions
    const canCancel = req.user.role === 'admin' || req.user.id === booking.employeeId;
    if (!canCancel) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Cannot cancel past bookings
    if (new Date(booking.startTime) < new Date()) {
      return res.status(400).json({ error: 'Cannot cancel past bookings' });
    }
    
    await enterpriseDb.bookings.update(id, {
      status: 'cancelled',
      rejectionReason: reason || 'Cancelled by user'
    });
    
    res.json({ message: 'Booking cancelled successfully' });
    
    logger.info('Booking cancelled', {
      userId: req.user.id,
      bookingId: id,
      reason
    });
  } catch (error) {
    next(error);
  }
};

// Update booking status (approve/reject)
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const booking = await enterpriseDb.bookings.findById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Booking already processed' });
    }
    
    const updateData = {
      status,
      approvedBy: req.user.id,
      approvalDate: new Date()
    };
    
    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    
    const updatedBooking = await enterpriseDb.bookings.update(id, updateData);
    
    // Send notification to booking requester
    await enterpriseDb.notifications.create({
      type: 'booking',
      title: `Room Booking ${status}`,
      message: `Your room booking request has been ${status}${rejectionReason ? ': ' + rejectionReason : ''}`,
      recipientType: 'individual',
      recipients: [booking.employeeId],
      senderId: req.user.id,
      priority: 'high',
      channels: ['email', 'push']
    });
    
    res.json({
      message: `Booking ${status} successfully`,
      booking: updatedBooking
    });
    
    logger.info('Booking status updated', {
      userId: req.user.id,
      bookingId: id,
      status,
      rejectionReason
    });
  } catch (error) {
    next(error);
  }
};

// Get room availability
exports.getRoomAvailability = async (req, res, next) => {
  try {
    const { roomId, date } = req.query;
    
    if (!roomId || !date) {
      return res.status(400).json({ error: 'Room ID and date are required' });
    }
    
    const room = await enterpriseDb.rooms.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Get all approved bookings for the room on the specified date
    const bookings = await enterpriseDb.bookings.findAll({
      roomId,
      status: 'approved'
    });
    
    const targetDate = new Date(date).toDateString();
    const dayBookings = bookings.filter(booking => 
      new Date(booking.startTime).toDateString() === targetDate
    );
    
    // Generate time slots (9 AM to 6 PM, 1-hour slots)
    const timeSlots = [];
    const startHour = 9;
    const endHour = 18;
    
    for (let hour = startHour; hour < endHour; hour++) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setHours(hour + 1, 0, 0, 0);
      
      const isBooked = dayBookings.some(booking => {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);
        return (slotStart < bookingEnd && slotEnd > bookingStart);
      });
      
      timeSlots.push({
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        available: !isBooked,
        booking: isBooked ? dayBookings.find(booking => {
          const bookingStart = new Date(booking.startTime);
          const bookingEnd = new Date(booking.endTime);
          return (slotStart < bookingEnd && slotEnd > bookingStart);
        }) : null
      });
    }
    
    res.json({
      room: {
        id: room.id,
        name: room.name,
        roomNumber: room.roomNumber,
        capacity: room.capacity,
        facilities: room.facilities
      },
      date,
      timeSlots,
      totalSlots: timeSlots.length,
      availableSlots: timeSlots.filter(slot => slot.available).length
    });
    
    logger.info('Room availability retrieved', {
      userId: req.user.id,
      roomId,
      date,
      availableSlots: timeSlots.filter(slot => slot.available).length
    });
  } catch (error) {
    next(error);
  }
};

// Get booking statistics
exports.getBookingStats = async (req, res, next) => {
  try {
    const { startDate, endDate, buildingId } = req.query;
    
    let bookings = await enterpriseDb.bookings.findAll();
    
    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      bookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.startTime);
        return bookingDate >= start && bookingDate <= end;
      });
    }
    
    // Filter by building
    if (buildingId) {
      const rooms = await enterpriseDb.rooms.findAll({ buildingId });
      const roomIds = rooms.map(room => room.id);
      bookings = bookings.filter(booking => roomIds.includes(booking.roomId));
    }
    
    const stats = {
      totalBookings: bookings.length,
      approvedBookings: bookings.filter(b => b.status === 'approved').length,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      rejectedBookings: bookings.filter(b => b.status === 'rejected').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      totalRevenue: bookings
        .filter(b => b.status === 'approved')
        .reduce((sum, b) => sum + (b.cost || 0), 0),
      
      // Room utilization
      roomStats: {},
      
      // Department wise bookings
      departmentStats: {},
      
      // Peak hours
      hourlyStats: Array(24).fill(0)
    };
    
    // Calculate room and department stats
    for (const booking of bookings.filter(b => b.status === 'approved')) {
      // Room stats
      if (!stats.roomStats[booking.roomId]) {
        stats.roomStats[booking.roomId] = {
          bookings: 0,
          totalHours: 0,
          revenue: 0
        };
      }
      stats.roomStats[booking.roomId].bookings++;
      
      const duration = (new Date(booking.endTime) - new Date(booking.startTime)) / (1000 * 60 * 60);
      stats.roomStats[booking.roomId].totalHours += duration;
      stats.roomStats[booking.roomId].revenue += booking.cost || 0;
      
      // Hourly stats
      const hour = new Date(booking.startTime).getHours();
      stats.hourlyStats[hour]++;
      
      // Department stats
      const employee = await enterpriseDb.employees.findById(booking.employeeId);
      if (employee) {
        if (!stats.departmentStats[employee.department]) {
          stats.departmentStats[employee.department] = 0;
        }
        stats.departmentStats[employee.department]++;
      }
    }
    
    res.json({ stats });
    
    logger.info('Booking statistics retrieved', {
      userId: req.user.id,
      totalBookings: stats.totalBookings,
      dateRange: { startDate, endDate },
      buildingId
    });
  } catch (error) {
    next(error);
  }
};
