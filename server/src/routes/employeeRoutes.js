const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/constants');

// All routes require authentication
router.use(requireAuth);

// Get all employees with filtering
router.get('/', 
  requirePermission(PERMISSIONS.READ_EMPLOYEES),
  employeeController.getAllEmployees
);

// Get employee statistics
router.get('/stats', 
  requirePermission(PERMISSIONS.READ_EMPLOYEES),
  employeeController.getEmployeeStats
);

// Get department hierarchy
router.get('/hierarchy', 
  requirePermission(PERMISSIONS.READ_EMPLOYEES),
  employeeController.getDepartmentHierarchy
);

// Get employee by ID
router.get('/:id', 
  requirePermission(PERMISSIONS.READ_EMPLOYEES),
  employeeController.getEmployeeById
);

// Create new employee
router.post('/', 
  requirePermission(PERMISSIONS.CREATE_EMPLOYEES),
  employeeController.createEmployee
);

// Update employee
router.put('/:id', 
  requirePermission(PERMISSIONS.UPDATE_EMPLOYEES),
  employeeController.updateEmployee
);

// Delete employee (soft delete)
router.delete('/:id', 
  requirePermission(PERMISSIONS.DELETE_EMPLOYEES),
  employeeController.deleteEmployee
);

module.exports = router;
