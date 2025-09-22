const enterpriseDb = require('../utils/enterpriseDb');
const { logger } = require('../utils/logger');
const { hashPassword } = require('../utils/auth');

// Get all employees with filtering
exports.getAllEmployees = async (req, res, next) => {
  try {
    const { department, status, buildingId, search } = req.query;
    const filters = {};
    
    if (department) filters.department = department;
    if (status) filters.status = status;
    if (buildingId) filters.buildingId = buildingId;
    
    let employees = await enterpriseDb.employees.findAll(filters);
    
    // Search functionality
    if (search) {
      const searchLower = search.toLowerCase();
      employees = employees.filter(emp => 
        emp.firstName.toLowerCase().includes(searchLower) ||
        emp.lastName.toLowerCase().includes(searchLower) ||
        emp.employeeId.toLowerCase().includes(searchLower) ||
        emp.email.toLowerCase().includes(searchLower)
      );
    }
    
    // Remove sensitive data
    const sanitizedEmployees = employees.map(emp => ({
      ...emp,
      emergencyContact: req.user.role === 'admin' ? emp.emergencyContact : undefined
    }));
    
    res.json({
      employees: sanitizedEmployees,
      total: sanitizedEmployees.length,
      filters: { department, status, buildingId, search }
    });
    
    logger.info('Employees retrieved', {
      userId: req.user.id,
      count: sanitizedEmployees.length,
      filters
    });
  } catch (error) {
    next(error);
  }
};

// Get employee by ID
exports.getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await enterpriseDb.employees.findById(id);
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Check permissions - employees can only see their own full details
    if (req.user.role !== 'admin' && req.user.id !== employee.id) {
      const sanitized = {
        id: employee.id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        department: employee.department,
        designation: employee.designation,
        profilePicture: employee.profilePicture
      };
      return res.json(sanitized);
    }
    
    res.json(employee);
    
    logger.info('Employee details retrieved', {
      userId: req.user.id,
      targetEmployeeId: id
    });
  } catch (error) {
    next(error);
  }
};

// Create new employee
exports.createEmployee = async (req, res, next) => {
  try {
    const employeeData = req.body;
    
    // Generate employee ID
    const existingEmployees = await enterpriseDb.employees.findAll();
    const maxEmpId = Math.max(...existingEmployees.map(emp => 
      parseInt(emp.employeeId.replace('TM', ''))
    ), 0);
    employeeData.employeeId = `TM${String(maxEmpId + 1).padStart(6, '0')}`;
    
    // Hash password if provided
    if (employeeData.password) {
      employeeData.passwordHash = await hashPassword(employeeData.password);
      delete employeeData.password;
    }
    
    const employee = await enterpriseDb.employees.create(employeeData);
    
    res.status(201).json({
      message: 'Employee created successfully',
      employee: {
        ...employee,
        passwordHash: undefined // Don't return password hash
      }
    });
    
    logger.info('Employee created', {
      userId: req.user.id,
      newEmployeeId: employee.id,
      employeeId: employee.employeeId
    });
  } catch (error) {
    next(error);
  }
};

// Update employee
exports.updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Check if employee exists
    const existingEmployee = await enterpriseDb.employees.findById(id);
    if (!existingEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Check permissions - employees can only update their own basic info
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Restrict fields for non-admin users
    if (req.user.role !== 'admin') {
      const allowedFields = ['phone', 'emergencyContact', 'profilePicture'];
      const filteredData = {};
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      });
      updateData = filteredData;
    }
    
    // Hash password if being updated
    if (updateData.password) {
      updateData.passwordHash = await hashPassword(updateData.password);
      delete updateData.password;
    }
    
    const updatedEmployee = await enterpriseDb.employees.update(id, updateData);
    
    res.json({
      message: 'Employee updated successfully',
      employee: {
        ...updatedEmployee,
        passwordHash: undefined
      }
    });
    
    logger.info('Employee updated', {
      userId: req.user.id,
      targetEmployeeId: id,
      updatedFields: Object.keys(updateData)
    });
  } catch (error) {
    next(error);
  }
};

// Delete employee (soft delete)
exports.deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const employee = await enterpriseDb.employees.findById(id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Soft delete by updating status
    await enterpriseDb.employees.update(id, { 
      status: 'inactive',
      updatedAt: new Date()
    });
    
    res.json({ message: 'Employee deactivated successfully' });
    
    logger.info('Employee deactivated', {
      userId: req.user.id,
      targetEmployeeId: id
    });
  } catch (error) {
    next(error);
  }
};

// Get employee hierarchy (reporting structure)
exports.getEmployeeHierarchy = async (req, res, next) => {
  try {
    const employees = await enterpriseDb.employees.findAll({ status: 'active' });
    
    // Build hierarchy tree
    const buildHierarchy = (managerId = null) => {
      return employees
        .filter(emp => emp.reportingManager === managerId)
        .map(emp => ({
          ...emp,
          subordinates: buildHierarchy(emp.id)
        }));
    };
    
    const hierarchy = buildHierarchy();
    
    res.json({ hierarchy });
    
    logger.info('Employee hierarchy retrieved', {
      userId: req.user.id,
      totalEmployees: employees.length
    });
  } catch (error) {
    next(error);
  }
};

// Get department hierarchy (alias for getEmployeeHierarchy)
exports.getDepartmentHierarchy = async (req, res, next) => {
  try {
    const employees = await enterpriseDb.employees.findAll({ status: 'active' });
    
    // Build hierarchy tree
    const buildHierarchy = (managerId = null) => {
      return employees
        .filter(emp => emp.reportingManager === managerId)
        .map(emp => ({
          ...emp,
          subordinates: buildHierarchy(emp.id)
        }));
    };
    
    const hierarchy = buildHierarchy();
    
    res.json({ hierarchy });
    
    logger.info('Department hierarchy retrieved', {
      userId: req.user.id,
      totalEmployees: employees.length
    });
  } catch (error) {
    next(error);
  }
};

// Get employee statistics
exports.getEmployeeStats = async (req, res, next) => {
  try {
    const { department, buildingId } = req.query;
    
    let employees = await enterpriseDb.employees.findAll({ status: 'active' });
    const departments = await enterpriseDb.departments.findAll();
    
    // Filter by department if specified
    if (department) {
      employees = employees.filter(emp => emp.department === department);
    }
    
    // Filter by building if specified
    if (buildingId) {
      employees = employees.filter(emp => emp.buildingId === buildingId);
    }
    
    const stats = {
      totalEmployees: employees.length,
      departmentBreakdown: {},
      designationBreakdown: {},
      buildingBreakdown: {},
      tenureStats: {
        lessThan1Year: 0,
        oneToThreeYears: 0,
        threeToFiveYears: 0,
        moreThanFiveYears: 0
      },
      averageTenure: 0
    };
    
    // Calculate department breakdown
    departments.forEach(dept => {
      const deptEmployees = employees.filter(emp => emp.department === dept.code);
      stats.departmentBreakdown[dept.name] = {
        count: deptEmployees.length,
        percentage: employees.length > 0 ? (deptEmployees.length / employees.length * 100).toFixed(1) : 0
      };
    });
    
    // Calculate designation breakdown
    const designations = [...new Set(employees.map(emp => emp.designation))];
    designations.forEach(designation => {
      const count = employees.filter(emp => emp.designation === designation).length;
      stats.designationBreakdown[designation] = {
        count,
        percentage: employees.length > 0 ? (count / employees.length * 100).toFixed(1) : 0
      };
    });
    
    // Calculate building breakdown
    const buildings = [...new Set(employees.map(emp => emp.buildingId))];
    for (const buildingId of buildings) {
      const building = await enterpriseDb.buildings.findById(buildingId);
      const count = employees.filter(emp => emp.buildingId === buildingId).length;
      stats.buildingBreakdown[building ? building.name : 'Unknown'] = {
        count,
        percentage: employees.length > 0 ? (count / employees.length * 100).toFixed(1) : 0
      };
    }
    
    // Calculate tenure statistics
    let totalTenure = 0;
    employees.forEach(emp => {
      const tenure = (new Date() - new Date(emp.joiningDate)) / (1000 * 60 * 60 * 24 * 365);
      totalTenure += tenure;
      
      if (tenure < 1) {
        stats.tenureStats.lessThan1Year++;
      } else if (tenure < 3) {
        stats.tenureStats.oneToThreeYears++;
      } else if (tenure < 5) {
        stats.tenureStats.threeToFiveYears++;
      } else {
        stats.tenureStats.moreThanFiveYears++;
      }
    });
    
    stats.averageTenure = employees.length > 0 ? (totalTenure / employees.length).toFixed(1) : 0;
    
    res.json({ stats });
    
    logger.info('Employee statistics retrieved', {
      userId: req.user.id,
      totalEmployees: stats.totalEmployees,
      department,
      buildingId
    });
  } catch (error) {
    next(error);
  }
};

// Get department statistics (alias for backward compatibility)
exports.getDepartmentStats = async (req, res, next) => {
  try {
    const employees = await enterpriseDb.employees.findAll({ status: 'active' });
    const departments = await enterpriseDb.departments.findAll();
    
    const stats = departments.map(dept => {
      const deptEmployees = employees.filter(emp => emp.department === dept.code);
      return {
        ...dept,
        actualEmployeeCount: deptEmployees.length,
        designations: [...new Set(deptEmployees.map(emp => emp.designation))],
        avgTenure: deptEmployees.length > 0 ? 
          deptEmployees.reduce((sum, emp) => {
            const tenure = (new Date() - new Date(emp.joiningDate)) / (1000 * 60 * 60 * 24 * 365);
            return sum + tenure;
          }, 0) / deptEmployees.length : 0
      };
    });
    
    res.json({ departmentStats: stats });
    
    logger.info('Department statistics retrieved', {
      userId: req.user.id,
      departmentCount: stats.length
    });
  } catch (error) {
    next(error);
  }
};
