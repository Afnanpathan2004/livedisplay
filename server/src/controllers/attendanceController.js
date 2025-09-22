const enterpriseDb = require('../utils/enterpriseDb');
const { logger } = require('../utils/logger');

// Get attendance records with filtering
exports.getAttendance = async (req, res, next) => {
  try {
    const { employeeId, date, startDate, endDate, status } = req.query;
    const filters = {};
    
    if (employeeId) filters.employeeId = employeeId;
    if (date) filters.date = date;
    if (status) filters.status = status;
    
    let attendance = await enterpriseDb.attendance.findAll(filters);
    
    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      attendance = attendance.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= start && recordDate <= end;
      });
    }
    
    // Enrich with employee details
    const enrichedAttendance = await Promise.all(attendance.map(async (record) => {
      const employee = await enterpriseDb.employees.findById(record.employeeId);
      return {
        ...record,
        employee: employee ? {
          name: `${employee.firstName} ${employee.lastName}`,
          employeeId: employee.employeeId,
          department: employee.department
        } : null
      };
    }));
    
    res.json({
      attendance: enrichedAttendance,
      total: enrichedAttendance.length,
      filters: { employeeId, date, startDate, endDate, status }
    });
    
    logger.info('Attendance records retrieved', {
      userId: req.user.id,
      count: enrichedAttendance.length,
      filters
    });
  } catch (error) {
    next(error);
  }
};

// Record check-in
exports.checkIn = async (req, res, next) => {
  try {
    const { location, buildingId, remarks } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already checked in today
    const existingRecord = await enterpriseDb.attendance.findAll({
      employeeId: req.user.id,
      date: today
    });
    
    if (existingRecord.length > 0 && existingRecord[0].checkIn) {
      return res.status(400).json({ error: 'Already checked in today' });
    }
    
    const now = new Date();
    const workStartTime = new Date();
    workStartTime.setHours(9, 0, 0, 0); // 9 AM
    
    const status = now > workStartTime ? 'late' : 'present';
    
    const attendanceData = {
      employeeId: req.user.id,
      date: today,
      checkIn: now,
      status,
      location: location || 'office',
      buildingId: buildingId || req.user.buildingId,
      remarks
    };
    
    let record;
    if (existingRecord.length > 0) {
      record = await enterpriseDb.attendance.update(existingRecord[0].id, attendanceData);
    } else {
      record = await enterpriseDb.attendance.create(attendanceData);
    }
    
    // Send notification if late
    if (status === 'late') {
      await enterpriseDb.notifications.create({
        type: 'attendance',
        title: 'Late Check-in',
        message: `${req.user.firstName} ${req.user.lastName} checked in late at ${now.toLocaleTimeString()}`,
        recipientType: 'individual',
        recipients: [req.user.reportingManager],
        senderId: req.user.id,
        priority: 'medium',
        channels: ['push']
      });
    }
    
    res.json({
      message: 'Check-in recorded successfully',
      record,
      status
    });
    
    logger.info('Employee checked in', {
      userId: req.user.id,
      checkInTime: now,
      status,
      location
    });
  } catch (error) {
    next(error);
  }
};

// Record check-out
exports.checkOut = async (req, res, next) => {
  try {
    const { remarks } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    const existingRecord = await enterpriseDb.attendance.findAll({
      employeeId: req.user.id,
      date: today
    });
    
    if (existingRecord.length === 0 || !existingRecord[0].checkIn) {
      return res.status(400).json({ error: 'No check-in record found for today' });
    }
    
    if (existingRecord[0].checkOut) {
      return res.status(400).json({ error: 'Already checked out today' });
    }
    
    const now = new Date();
    const checkInTime = new Date(existingRecord[0].checkIn);
    const totalHours = (now - checkInTime) / (1000 * 60 * 60);
    
    const workEndTime = new Date();
    workEndTime.setHours(18, 0, 0, 0); // 6 PM
    
    let status = existingRecord[0].status;
    if (now < workEndTime && totalHours < 8) {
      status = 'early_departure';
    }
    
    const updateData = {
      checkOut: now,
      totalHours: Math.round(totalHours * 100) / 100,
      status,
      remarks: remarks || existingRecord[0].remarks
    };
    
    const record = await enterpriseDb.attendance.update(existingRecord[0].id, updateData);
    
    // Send notification if early departure
    if (status === 'early_departure') {
      await enterpriseDb.notifications.create({
        type: 'attendance',
        title: 'Early Departure',
        message: `${req.user.firstName} ${req.user.lastName} checked out early at ${now.toLocaleTimeString()}`,
        recipientType: 'individual',
        recipients: [req.user.reportingManager],
        senderId: req.user.id,
        priority: 'medium',
        channels: ['push']
      });
    }
    
    res.json({
      message: 'Check-out recorded successfully',
      record,
      totalHours: updateData.totalHours
    });
    
    logger.info('Employee checked out', {
      userId: req.user.id,
      checkOutTime: now,
      totalHours: updateData.totalHours,
      status
    });
  } catch (error) {
    next(error);
  }
};

// Get attendance summary for employee
exports.getAttendanceSummary = async (req, res, next) => {
  try {
    const { employeeId, month, year } = req.query;
    const targetEmployeeId = employeeId || req.user.id;
    
    // Check permissions
    if (req.user.role !== 'admin' && req.user.id !== targetEmployeeId) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    
    // Get all attendance for the month
    const attendance = await enterpriseDb.attendance.findAll({ employeeId: targetEmployeeId });
    
    const monthlyAttendance = attendance.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() + 1 === targetMonth && recordDate.getFullYear() === targetYear;
    });
    
    const summary = {
      month: targetMonth,
      year: targetYear,
      totalDays: monthlyAttendance.length,
      presentDays: monthlyAttendance.filter(r => r.status === 'present').length,
      lateDays: monthlyAttendance.filter(r => r.status === 'late').length,
      halfDays: monthlyAttendance.filter(r => r.status === 'half_day').length,
      earlyDepartures: monthlyAttendance.filter(r => r.status === 'early_departure').length,
      totalHours: monthlyAttendance.reduce((sum, r) => sum + (r.totalHours || 0), 0),
      averageHours: monthlyAttendance.length > 0 ? 
        monthlyAttendance.reduce((sum, r) => sum + (r.totalHours || 0), 0) / monthlyAttendance.length : 0,
      
      // Working days calculation (excluding weekends)
      workingDaysInMonth: getWorkingDaysInMonth(targetYear, targetMonth - 1),
      attendancePercentage: 0
    };
    
    summary.attendancePercentage = summary.workingDaysInMonth > 0 ? 
      (summary.presentDays + summary.lateDays + summary.halfDays) / summary.workingDaysInMonth * 100 : 0;
    
    res.json({ summary, records: monthlyAttendance });
    
    logger.info('Attendance summary retrieved', {
      userId: req.user.id,
      targetEmployeeId,
      month: targetMonth,
      year: targetYear,
      attendancePercentage: summary.attendancePercentage
    });
  } catch (error) {
    next(error);
  }
};

// Get department attendance statistics
exports.getDepartmentAttendanceStats = async (req, res, next) => {
  try {
    const { department, date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Get all employees in department
    const employees = await enterpriseDb.employees.findAll({ 
      department: department || req.user.department,
      status: 'active'
    });
    
    // Get attendance for all employees on target date
    const attendance = await enterpriseDb.attendance.findAll({ date: targetDate });
    
    const stats = {
      date: targetDate,
      department: department || req.user.department,
      totalEmployees: employees.length,
      presentEmployees: 0,
      lateEmployees: 0,
      absentEmployees: 0,
      onLeaveEmployees: 0,
      attendanceRate: 0,
      
      employeeDetails: []
    };
    
    for (const employee of employees) {
      const empAttendance = attendance.find(a => a.employeeId === employee.id);
      
      let status = 'absent';
      if (empAttendance) {
        status = empAttendance.status;
        if (status === 'present' || status === 'late') {
          stats.presentEmployees++;
        }
        if (status === 'late') {
          stats.lateEmployees++;
        }
      } else {
        // Check if on leave
        const leaves = await enterpriseDb.leaves.findAll({ 
          employeeId: employee.id,
          status: 'approved'
        });
        
        const isOnLeave = leaves.some(leave => {
          const startDate = new Date(leave.startDate);
          const endDate = new Date(leave.endDate);
          const checkDate = new Date(targetDate);
          return checkDate >= startDate && checkDate <= endDate;
        });
        
        if (isOnLeave) {
          status = 'on_leave';
          stats.onLeaveEmployees++;
        } else {
          stats.absentEmployees++;
        }
      }
      
      stats.employeeDetails.push({
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        employeeId: employee.employeeId,
        status,
        checkIn: empAttendance?.checkIn,
        checkOut: empAttendance?.checkOut,
        totalHours: empAttendance?.totalHours
      });
    }
    
    stats.attendanceRate = stats.totalEmployees > 0 ? 
      (stats.presentEmployees / stats.totalEmployees) * 100 : 0;
    
    res.json({ stats });
    
    logger.info('Department attendance stats retrieved', {
      userId: req.user.id,
      department: stats.department,
      date: targetDate,
      attendanceRate: stats.attendanceRate
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to calculate working days in a month
function getWorkingDaysInMonth(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let workingDays = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    // Exclude Saturday (6) and Sunday (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
  }
  
  return workingDays;
}
