const enterpriseDb = require('../utils/enterpriseDb');
const { logger } = require('../utils/logger');

// Get all visitors with filtering
exports.getAllVisitors = async (req, res, next) => {
  try {
    const { hostEmployeeId, status, visitDate, buildingId } = req.query;
    const filters = {};
    
    if (hostEmployeeId) filters.hostEmployeeId = hostEmployeeId;
    if (status) filters.status = status;
    if (visitDate) filters.visitDate = visitDate;
    
    let visitors = await enterpriseDb.visitors.findAll(filters);
    
    // Filter by building if specified
    if (buildingId) {
      visitors = visitors.filter(visitor => visitor.buildingId === buildingId);
    }
    
    // Enrich with host employee details
    const enrichedVisitors = await Promise.all(visitors.map(async (visitor) => {
      const host = await enterpriseDb.employees.findById(visitor.hostEmployeeId);
      return {
        ...visitor,
        host: host ? {
          name: `${host.firstName} ${host.lastName}`,
          employeeId: host.employeeId,
          department: host.department,
          email: host.email,
          phone: host.phone
        } : null
      };
    }));
    
    res.json({
      visitors: enrichedVisitors,
      total: enrichedVisitors.length,
      filters: { hostEmployeeId, status, visitDate, buildingId }
    });
    
    logger.info('Visitors retrieved', {
      userId: req.user.id,
      count: enrichedVisitors.length,
      filters
    });
  } catch (error) {
    next(error);
  }
};

// Get visitor by ID
exports.getVisitorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const visitor = await enterpriseDb.visitors.findById(id);
    
    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }
    
    // Check permissions
    if (req.user.role !== 'admin' && req.user.id !== visitor.hostEmployeeId) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Enrich with host details
    const host = await enterpriseDb.employees.findById(visitor.hostEmployeeId);
    const building = await enterpriseDb.buildings.findById(visitor.buildingId);
    const floor = await enterpriseDb.floors.findById(visitor.floorId);
    
    res.json({
      ...visitor,
      host: host ? {
        name: `${host.firstName} ${host.lastName}`,
        employeeId: host.employeeId,
        department: host.department,
        email: host.email,
        phone: host.phone
      } : null,
      building: building ? { name: building.name, address: building.address } : null,
      floor: floor ? { name: floor.name, floorNumber: floor.floorNumber } : null
    });
    
    logger.info('Visitor details retrieved', {
      userId: req.user.id,
      visitorId: id
    });
  } catch (error) {
    next(error);
  }
};

// Register new visitor (alias for createVisitor)
exports.registerVisitor = async (req, res, next) => {
  try {
    const visitorData = {
      ...req.body,
      hostEmployeeId: req.user.id
    };
    
    // Generate visitor badge number
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const todayVisitors = await enterpriseDb.visitors.findAll({ visitDate: visitorData.visitDate });
    const badgeNumber = `VIS-${today}-${String(todayVisitors.length + 1).padStart(3, '0')}`;
    visitorData.visitorBadge = badgeNumber;
    
    // Validate building and floor
    const building = await enterpriseDb.buildings.findById(visitorData.buildingId);
    if (!building) {
      return res.status(404).json({ error: 'Building not found' });
    }
    
    const floor = await enterpriseDb.floors.findById(visitorData.floorId);
    if (!floor || floor.buildingId !== visitorData.buildingId) {
      return res.status(400).json({ error: 'Invalid floor for the selected building' });
    }
    
    // Check if high security building requires additional approval
    if (building.securityLevel === 'high') {
      visitorData.securityApproval = 'pending';
    } else {
      visitorData.securityApproval = 'approved';
    }
    
    const visitor = await enterpriseDb.visitors.create(visitorData);
    
    // Send notification to security if approval required
    if (building.securityLevel === 'high') {
      await enterpriseDb.notifications.create({
        type: 'visitor',
        title: 'Visitor Security Approval Required',
        message: `New visitor ${visitor.name} from ${visitor.company} requires security approval for ${building.name}`,
        recipientType: 'department',
        recipients: ['security'],
        senderId: req.user.id,
        priority: 'high',
        channels: ['email', 'push']
      });
    }
    
    // Send confirmation to host
    await enterpriseDb.notifications.create({
      type: 'visitor',
      title: 'Visitor Entry Created',
      message: `Visitor entry created for ${visitor.name}. Badge: ${visitor.visitorBadge}`,
      recipientType: 'individual',
      recipients: [req.user.id],
      senderId: 'system',
      priority: 'medium',
      channels: ['email']
    });
    
    res.status(201).json({
      message: 'Visitor entry created successfully',
      visitor: {
        ...visitor,
        building: { name: building.name },
        floor: { name: floor.name }
      }
    });
    
    logger.info('Visitor entry created', {
      userId: req.user.id,
      visitorId: visitor.id,
      visitorBadge: visitor.visitorBadge,
      securityApproval: visitor.securityApproval
    });
  } catch (error) {
    next(error);
  }
};

// Update visitor (mainly for check-in/check-out and security approval)
exports.updateVisitor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const visitor = await enterpriseDb.visitors.findById(id);
    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }
    
    // Check permissions
    const canUpdate = req.user.role === 'admin' || 
                     req.user.id === visitor.hostEmployeeId ||
                     req.user.department === 'security';
    
    if (!canUpdate) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Handle security approval
    if (updateData.securityApproval && req.user.department !== 'security' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only security personnel can approve visitors' });
    }
    
    // Handle check-in/check-out
    if (updateData.status === 'arrived') {
      updateData.actualArrival = new Date();
    } else if (updateData.status === 'departed') {
      updateData.actualDeparture = new Date();
    }
    
    const updatedVisitor = await enterpriseDb.visitors.update(id, updateData);
    
    // Send notifications for status changes
    if (updateData.securityApproval === 'approved') {
      await enterpriseDb.notifications.create({
        type: 'visitor',
        title: 'Visitor Approved',
        message: `Visitor ${visitor.name} has been approved by security`,
        recipientType: 'individual',
        recipients: [visitor.hostEmployeeId],
        senderId: req.user.id,
        priority: 'medium',
        channels: ['push']
      });
    } else if (updateData.securityApproval === 'rejected') {
      await enterpriseDb.notifications.create({
        type: 'visitor',
        title: 'Visitor Rejected',
        message: `Visitor ${visitor.name} has been rejected by security`,
        recipientType: 'individual',
        recipients: [visitor.hostEmployeeId],
        senderId: req.user.id,
        priority: 'high',
        channels: ['email', 'push']
      });
    }
    
    res.json({
      message: 'Visitor updated successfully',
      visitor: updatedVisitor
    });
    
    logger.info('Visitor updated', {
      userId: req.user.id,
      visitorId: id,
      updatedFields: Object.keys(updateData)
    });
  } catch (error) {
    next(error);
  }
};

// Update visitor status (approve/reject)
exports.updateVisitorStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const visitor = await enterpriseDb.visitors.findById(id);
    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }
    
    const updateData = {
      securityApproval: status,
      approvedBy: req.user.id,
      approvalDate: new Date()
    };
    
    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    
    const updatedVisitor = await enterpriseDb.visitors.update(id, updateData);
    
    // Send notification to host employee
    await enterpriseDb.notifications.create({
      type: 'visitor',
      title: `Visitor ${status}`,
      message: `Visitor ${visitor.name} has been ${status} for ${new Date(visitor.visitDate).toDateString()}${rejectionReason ? ': ' + rejectionReason : ''}`,
      recipientType: 'individual',
      recipients: [visitor.hostEmployeeId],
      senderId: req.user.id,
      priority: 'medium',
      channels: ['email', 'push']
    });
    
    res.json({
      message: `Visitor ${status} successfully`,
      visitor: updatedVisitor
    });
    
    logger.info('Visitor status updated', {
      userId: req.user.id,
      visitorId: id,
      status,
      rejectionReason
    });
  } catch (error) {
    next(error);
  }
};

// Check-in visitor
exports.checkInVisitor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { actualArrivalTime, securityNotes } = req.body;
    
    const visitor = await enterpriseDb.visitors.findById(id);
    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }
    
    if (visitor.securityApproval !== 'approved') {
      return res.status(400).json({ error: 'Visitor not approved for entry' });
    }
    
    if (visitor.status === 'checked_in') {
      return res.status(400).json({ error: 'Visitor already checked in' });
    }
    
    const updateData = {
      status: 'checked_in',
      actualArrivalTime: actualArrivalTime || new Date(),
      checkedInBy: req.user.id,
      securityNotes
    };
    
    const updatedVisitor = await enterpriseDb.visitors.update(id, updateData);
    
    // Notify host employee
    await enterpriseDb.notifications.create({
      type: 'visitor',
      title: 'Visitor Checked In',
      message: `${visitor.name} has checked in and is waiting to meet you`,
      recipientType: 'individual',
      recipients: [visitor.hostEmployeeId],
      senderId: req.user.id,
      priority: 'high',
      channels: ['push']
    });
    
    res.json({
      message: 'Visitor checked in successfully',
      visitor: updatedVisitor
    });
    
    logger.info('Visitor checked in', {
      userId: req.user.id,
      visitorId: id,
      actualArrivalTime: updateData.actualArrivalTime
    });
  } catch (error) {
    next(error);
  }
};

// Check-out visitor
exports.checkOutVisitor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { actualDepartureTime, exitNotes } = req.body;
    
    const visitor = await enterpriseDb.visitors.findById(id);
    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }
    
    if (visitor.status !== 'checked_in') {
      return res.status(400).json({ error: 'Visitor not checked in' });
    }
    
    const updateData = {
      status: 'completed',
      actualDepartureTime: actualDepartureTime || new Date(),
      checkedOutBy: req.user.id,
      exitNotes
    };
    
    const updatedVisitor = await enterpriseDb.visitors.update(id, updateData);
    
    res.json({
      message: 'Visitor checked out successfully',
      visitor: updatedVisitor
    });
    
    logger.info('Visitor checked out', {
      userId: req.user.id,
      visitorId: id,
      actualDepartureTime: updateData.actualDepartureTime
    });
  } catch (error) {
    next(error);
  }
};

// Get visitor statistics
exports.getVisitorStats = async (req, res, next) => {
  try {
    const { startDate, endDate, buildingId } = req.query;
    
    let visitors = await enterpriseDb.visitors.findAll();
    
    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      visitors = visitors.filter(visitor => {
        const visitDate = new Date(visitor.visitDate);
        return visitDate >= start && visitDate <= end;
      });
    }
    
    // Filter by building
    if (buildingId) {
      visitors = visitors.filter(visitor => visitor.buildingId === buildingId);
    }
    
    const stats = {
      totalVisitors: visitors.length,
      scheduledVisitors: visitors.filter(v => v.status === 'scheduled').length,
      arrivedVisitors: visitors.filter(v => v.status === 'arrived').length,
      departedVisitors: visitors.filter(v => v.status === 'departed').length,
      cancelledVisitors: visitors.filter(v => v.status === 'cancelled').length,
      
      securityApprovals: {
        pending: visitors.filter(v => v.securityApproval === 'pending').length,
        approved: visitors.filter(v => v.securityApproval === 'approved').length,
        rejected: visitors.filter(v => v.securityApproval === 'rejected').length
      },
      
      // Company wise visitors
      companyStats: {},
      
      // Purpose wise visitors
      purposeStats: {},
      
      // Daily visitor count
      dailyStats: {}
    };
    
    // Calculate company and purpose stats
    visitors.forEach(visitor => {
      // Company stats
      if (visitor.company) {
        stats.companyStats[visitor.company] = (stats.companyStats[visitor.company] || 0) + 1;
      }
      
      // Purpose stats
      if (visitor.purpose) {
        stats.purposeStats[visitor.purpose] = (stats.purposeStats[visitor.purpose] || 0) + 1;
      }
      
      // Daily stats
      const date = new Date(visitor.visitDate).toISOString().split('T')[0];
      stats.dailyStats[date] = (stats.dailyStats[date] || 0) + 1;
    });
    
    res.json({ stats });
    
    logger.info('Visitor statistics retrieved', {
      userId: req.user.id,
      totalVisitors: stats.totalVisitors,
      dateRange: { startDate, endDate },
      buildingId
    });
  } catch (error) {
    next(error);
  }
};

// Get today's visitors for security dashboard
exports.getTodayVisitors = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { buildingId } = req.query;
    
    let visitors = await enterpriseDb.visitors.findAll({ visitDate: today });
    
    if (buildingId) {
      visitors = visitors.filter(visitor => visitor.buildingId === buildingId);
    }
    
    // Enrich with host and building details
    const enrichedVisitors = await Promise.all(visitors.map(async (visitor) => {
      const host = await enterpriseDb.employees.findById(visitor.hostEmployeeId);
      const building = await enterpriseDb.buildings.findById(visitor.buildingId);
      const floor = await enterpriseDb.floors.findById(visitor.floorId);
      
      return {
        ...visitor,
        host: host ? {
          name: `${host.firstName} ${host.lastName}`,
          employeeId: host.employeeId,
          department: host.department,
          phone: host.phone
        } : null,
        building: building ? { name: building.name } : null,
        floor: floor ? { name: floor.name, floorNumber: floor.floorNumber } : null
      };
    }));
    
    // Sort by expected arrival time
    enrichedVisitors.sort((a, b) => 
      new Date(a.expectedArrival) - new Date(b.expectedArrival)
    );
    
    res.json({
      visitors: enrichedVisitors,
      date: today,
      summary: {
        total: enrichedVisitors.length,
        pending: enrichedVisitors.filter(v => v.status === 'scheduled').length,
        arrived: enrichedVisitors.filter(v => v.status === 'arrived').length,
        departed: enrichedVisitors.filter(v => v.status === 'departed').length
      }
    });
    
    logger.info('Today\'s visitors retrieved', {
      userId: req.user.id,
      count: enrichedVisitors.length,
      buildingId
    });
  } catch (error) {
    next(error);
  }
};
