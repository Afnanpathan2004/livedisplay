const enterpriseDb = require('../utils/enterpriseDb');
const { logger } = require('../utils/logger');

// Get leave requests with filtering
exports.getLeaves = async (req, res, next) => {
  try {
    const { employeeId, status, leaveType, startDate, endDate } = req.query;
    const filters = {};
    
    if (employeeId) filters.employeeId = employeeId;
    if (status) filters.status = status;
    
    let leaves = await enterpriseDb.leaves.findAll(filters);
    
    // Filter by leave type
    if (leaveType) {
      leaves = leaves.filter(leave => leave.leaveType === leaveType);
    }
    
    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      leaves = leaves.filter(leave => {
        const leaveStart = new Date(leave.startDate);
        const leaveEnd = new Date(leave.endDate);
        return (leaveStart <= end && leaveEnd >= start);
      });
    }
    
    // Enrich with employee details
    const enrichedLeaves = await Promise.all(leaves.map(async (leave) => {
      const employee = await enterpriseDb.employees.findById(leave.employeeId);
      const approver = leave.approvedBy ? 
        await enterpriseDb.employees.findById(leave.approvedBy) : null;
      
      return {
        ...leave,
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
      leaves: enrichedLeaves,
      total: enrichedLeaves.length,
      filters: { employeeId, status, leaveType, startDate, endDate }
    });
    
    logger.info('Leave requests retrieved', {
      userId: req.user.id,
      count: enrichedLeaves.length,
      filters
    });
  } catch (error) {
    next(error);
  }
};

// Apply for leave
exports.applyLeave = async (req, res, next) => {
  try {
    const leaveData = {
      ...req.body,
      employeeId: req.user.id
    };
    
    // Validate dates
    const startDate = new Date(leaveData.startDate);
    const endDate = new Date(leaveData.endDate);
    
    if (startDate > endDate) {
      return res.status(400).json({ error: 'Start date cannot be after end date' });
    }
    
    if (startDate < new Date()) {
      return res.status(400).json({ error: 'Cannot apply for past dates' });
    }
    
    // Calculate total days
    const timeDiff = endDate.getTime() - startDate.getTime();
    const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    leaveData.totalDays = totalDays;
    
    const leave = await enterpriseDb.leaves.create(leaveData);
    
    // Send notification to reporting manager
    if (req.user.reportingManager) {
      await enterpriseDb.notifications.create({
        type: 'leave',
        title: 'New Leave Request',
        message: `${req.user.firstName} ${req.user.lastName} has applied for ${leaveData.leaveType} leave from ${startDate.toDateString()} to ${endDate.toDateString()}`,
        recipientType: 'individual',
        recipients: [req.user.reportingManager],
        senderId: req.user.id,
        priority: 'medium',
        channels: ['email', 'push']
      });
    }
    
    res.status(201).json({
      message: 'Leave application submitted successfully',
      leave
    });
    
    logger.info('Leave application created', {
      userId: req.user.id,
      leaveId: leave.id,
      leaveType: leave.leaveType,
      totalDays: leave.totalDays
    });
  } catch (error) {
    next(error);
  }
};

// Approve/Reject leave
exports.updateLeaveStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const leave = await enterpriseDb.leaves.findById(id);
    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    
    if (leave.status !== 'pending') {
      return res.status(400).json({ error: 'Leave request already processed' });
    }
    
    const updateData = {
      status,
      approvedBy: req.user.id,
      approvalDate: new Date()
    };
    
    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    
    const updatedLeave = await enterpriseDb.leaves.update(id, updateData);
    
    // Send notification to employee
    await enterpriseDb.notifications.create({
      type: 'leave',
      title: `Leave Request ${status}`,
      message: `Your ${leave.leaveType} leave request has been ${status}${rejectionReason ? ': ' + rejectionReason : ''}`,
      recipientType: 'individual',
      recipients: [leave.employeeId],
      senderId: req.user.id,
      priority: 'high',
      channels: ['email', 'push']
    });
    
    res.json({
      message: `Leave request ${status} successfully`,
      leave: updatedLeave
    });
    
    logger.info('Leave status updated', {
      userId: req.user.id,
      leaveId: id,
      status,
      rejectionReason
    });
  } catch (error) {
    next(error);
  }
};

// Get leave balance for employee
exports.getLeaveBalance = async (req, res, next) => {
  try {
    const { employeeId } = req.query;
    const targetEmployeeId = employeeId || req.user.id;
    
    // Check permissions
    if (req.user.role !== 'admin' && req.user.id !== targetEmployeeId) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const employee = await enterpriseDb.employees.findById(targetEmployeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Get current year leaves
    const currentYear = new Date().getFullYear();
    const leaves = await enterpriseDb.leaves.findAll({
      employeeId: targetEmployeeId,
      status: 'approved'
    });
    
    const currentYearLeaves = leaves.filter(leave => {
      const leaveYear = new Date(leave.startDate).getFullYear();
      return leaveYear === currentYear;
    });
    
    // Calculate leave balance (standard Indian company policy)
    const leavePolicy = {
      casual: 12,
      sick: 12,
      earned: 21,
      maternity: 180,
      paternity: 15,
      emergency: 5
    };
    
    const balance = {};
    
    Object.keys(leavePolicy).forEach(type => {
      const usedLeaves = currentYearLeaves
        .filter(leave => leave.leaveType === type)
        .reduce((sum, leave) => sum + leave.totalDays, 0);
      
      balance[type] = {
        allocated: leavePolicy[type],
        used: usedLeaves,
        remaining: leavePolicy[type] - usedLeaves
      };
    });
    
    res.json({
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        employeeId: employee.employeeId,
        department: employee.department
      },
      year: currentYear,
      balance
    });
    
    logger.info('Leave balance retrieved', {
      userId: req.user.id,
      targetEmployeeId,
      year: currentYear
    });
  } catch (error) {
    next(error);
  }
};

// Get leave statistics
exports.getLeaveStats = async (req, res, next) => {
  try {
    const { year, department } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    // Get all leaves for the year
    let leaves = await enterpriseDb.leaves.findAll();
    
    // Filter by year
    leaves = leaves.filter(leave => {
      const leaveYear = new Date(leave.startDate).getFullYear();
      return leaveYear === targetYear;
    });
    
    // Filter by department if specified
    if (department) {
      const departmentEmployees = await enterpriseDb.employees.findAll({ department });
      const departmentEmployeeIds = departmentEmployees.map(emp => emp.id);
      leaves = leaves.filter(leave => departmentEmployeeIds.includes(leave.employeeId));
    }
    
    // Calculate statistics
    const stats = {
      totalRequests: leaves.length,
      pending: leaves.filter(leave => leave.status === 'pending').length,
      approved: leaves.filter(leave => leave.status === 'approved').length,
      rejected: leaves.filter(leave => leave.status === 'rejected').length,
      totalDaysRequested: leaves.reduce((sum, leave) => sum + (leave.totalDays || 0), 0),
      approvedDays: leaves
        .filter(leave => leave.status === 'approved')
        .reduce((sum, leave) => sum + (leave.totalDays || 0), 0),
      byType: {},
      byMonth: {},
      byDepartment: {}
    };
    
    // Calculate by leave type
    const leaveTypes = ['casual', 'sick', 'earned', 'maternity', 'paternity', 'emergency'];
    leaveTypes.forEach(type => {
      const typeLeaves = leaves.filter(leave => leave.leaveType === type);
      stats.byType[type] = {
        count: typeLeaves.length,
        totalDays: typeLeaves.reduce((sum, leave) => sum + (leave.totalDays || 0), 0),
        approved: typeLeaves.filter(leave => leave.status === 'approved').length,
        pending: typeLeaves.filter(leave => leave.status === 'pending').length,
        rejected: typeLeaves.filter(leave => leave.status === 'rejected').length
      };
    });
    
    // Calculate by month
    for (let month = 0; month < 12; month++) {
      const monthLeaves = leaves.filter(leave => {
        const leaveMonth = new Date(leave.startDate).getMonth();
        return leaveMonth === month;
      });
      
      const monthName = new Date(targetYear, month, 1).toLocaleString('default', { month: 'long' });
      stats.byMonth[monthName] = {
        count: monthLeaves.length,
        totalDays: monthLeaves.reduce((sum, leave) => sum + (leave.totalDays || 0), 0),
        approved: monthLeaves.filter(leave => leave.status === 'approved').length
      };
    }
    
    // Calculate by department
    const allEmployees = await enterpriseDb.employees.findAll();
    const departments = [...new Set(allEmployees.map(emp => emp.department))];
    
    for (const dept of departments) {
      const deptEmployees = allEmployees.filter(emp => emp.department === dept);
      const deptEmployeeIds = deptEmployees.map(emp => emp.id);
      const deptLeaves = leaves.filter(leave => deptEmployeeIds.includes(leave.employeeId));
      
      stats.byDepartment[dept] = {
        count: deptLeaves.length,
        totalDays: deptLeaves.reduce((sum, leave) => sum + (leave.totalDays || 0), 0),
        approved: deptLeaves.filter(leave => leave.status === 'approved').length,
        employeeCount: deptEmployees.length,
        averageDaysPerEmployee: deptEmployees.length > 0 ? 
          (deptLeaves.filter(leave => leave.status === 'approved')
            .reduce((sum, leave) => sum + (leave.totalDays || 0), 0) / deptEmployees.length).toFixed(1) : 0
      };
    }
    
    // Calculate approval rate
    stats.approvalRate = stats.totalRequests > 0 ? 
      ((stats.approved / stats.totalRequests) * 100).toFixed(1) : 0;
    
    // Calculate average processing time for completed requests
    const completedLeaves = leaves.filter(leave => 
      leave.status !== 'pending' && leave.approvalDate && leave.createdAt
    );
    
    if (completedLeaves.length > 0) {
      const totalProcessingTime = completedLeaves.reduce((sum, leave) => {
        const created = new Date(leave.createdAt);
        const approved = new Date(leave.approvalDate);
        return sum + (approved - created);
      }, 0);
      
      const avgProcessingDays = (totalProcessingTime / completedLeaves.length) / (1000 * 60 * 60 * 24);
      stats.averageProcessingDays = avgProcessingDays.toFixed(1);
    } else {
      stats.averageProcessingDays = 0;
    }
    
    res.json({
      year: targetYear,
      department: department || 'All',
      stats
    });
    
    logger.info('Leave statistics retrieved', {
      userId: req.user.id,
      year: targetYear,
      department,
      totalRequests: stats.totalRequests
    });
  } catch (error) {
    next(error);
  }
};
