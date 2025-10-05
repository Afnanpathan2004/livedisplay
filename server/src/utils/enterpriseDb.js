// Enterprise Office Management System - Enhanced Mock Database
const bcrypt = require('bcryptjs');

// Use crypto.randomUUID() instead of uuid package to avoid ES module issues
function generateId() {
  return require('crypto').randomUUID();
}

// Enhanced data structures for enterprise features
let employees = [
  {
    id: 'emp-admin-001',
    employeeId: 'TM001001',
    firstName: 'HR',
    lastName: 'Admin',
    email: 'hr.admin@tatamotors.com',
    phone: '+91-9876543210',
    department: 'HR',
    designation: 'HR Manager',
    reportingManager: null,
    buildingId: 'bld-001',
    floorId: 'flr-001',
    workstation: 'HR-001',
    joiningDate: new Date('2020-01-01'),
    status: 'active',
    profilePicture: null,
    emergencyContact: {
      name: 'Emergency Contact',
      phone: '+91-9876543211',
      relation: 'Spouse'
    },
    permissions: ['room_booking', 'visitor_invite', 'asset_manage', 'employee_manage', 'all_access'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

let buildings = [
  {
    id: 'bld-001',
    name: 'Tata Motors HQ - Block A',
    address: 'Bombay House, 24 Homi Mody Street, Mumbai 400001',
    totalFloors: 15,
    capacity: 2500,
    facilities: ['parking', 'cafeteria', 'gym', 'medical_center', 'conference_halls', 'security'],
    securityLevel: 'high',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'bld-002',
    name: 'Tata Motors HQ - Block B',
    address: 'Bombay House, 24 Homi Mody Street, Mumbai 400001',
    totalFloors: 12,
    capacity: 1800,
    facilities: ['parking', 'cafeteria', 'training_center', 'security'],
    securityLevel: 'high',
    isActive: true,
    createdAt: new Date()
  }
];

let floors = [
  {
    id: 'flr-001',
    buildingId: 'bld-001',
    floorNumber: 1,
    name: 'Ground Floor',
    totalRooms: 25,
    capacity: 150,
    facilities: ['reception', 'security', 'cafeteria', 'parking_access'],
    floorPlan: null,
    isActive: true
  },
  {
    id: 'flr-002',
    buildingId: 'bld-001',
    floorNumber: 2,
    name: 'First Floor - HR & Admin',
    totalRooms: 30,
    capacity: 200,
    facilities: ['meeting_rooms', 'hr_office', 'admin_office'],
    floorPlan: null,
    isActive: true
  }
];

let rooms = [
  {
    id: 'room-001',
    buildingId: 'bld-001',
    floorId: 'flr-002',
    roomNumber: 'HR-CONF-001',
    name: 'HR Conference Room Alpha',
    type: 'conference',
    capacity: 20,
    facilities: ['projector', 'whiteboard', 'ac', 'video_conferencing', 'audio_system'],
    isBookable: true,
    requiresApproval: true,
    approvers: ['emp-admin-001'],
    hourlyRate: 500,
    images: [],
    status: 'available',
    createdAt: new Date()
  },
  {
    id: 'room-002',
    buildingId: 'bld-001',
    floorId: 'flr-002',
    roomNumber: 'HR-MEET-001',
    name: 'HR Meeting Room Beta',
    type: 'meeting',
    capacity: 8,
    facilities: ['tv_screen', 'whiteboard', 'ac'],
    isBookable: true,
    requiresApproval: false,
    approvers: [],
    hourlyRate: 200,
    images: [],
    status: 'available',
    createdAt: new Date()
  }
];

let bookings = [];
let visitors = [];
let assets = [];
let attendance = [];
let leaves = [];
let departments = [
  {
    id: 'dept-001',
    name: 'Human Resources',
    code: 'HR',
    headOfDepartment: 'emp-admin-001',
    buildingId: 'bld-001',
    floorId: 'flr-002',
    budget: 5000000,
    employeeCount: 15,
    description: 'Human Resources and Administration',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'dept-002',
    name: 'Information Technology',
    code: 'IT',
    headOfDepartment: null,
    buildingId: 'bld-001',
    floorId: 'flr-002',
    budget: 10000000,
    employeeCount: 50,
    description: 'Information Technology and Digital Services',
    isActive: true,
    createdAt: new Date()
  }
];

let notifications = [];
let reports = [];

// Enhanced database operations
const enterpriseDb = {
  // Employee Management
  employees: {
    findAll: async (filters = {}) => {
      let result = employees;
      if (filters.department) result = result.filter(emp => emp.department === filters.department);
      if (filters.status) result = result.filter(emp => emp.status === filters.status);
      if (filters.buildingId) result = result.filter(emp => emp.buildingId === filters.buildingId);
      return result;
    },
    findById: async (id) => employees.find(emp => emp.id === id),
    findByEmployeeId: async (empId) => employees.find(emp => emp.employeeId === empId),
    create: async (data) => {
      const employee = {
        id: generateId(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      employees.push(employee);
      return employee;
    },
    update: async (id, data) => {
      const index = employees.findIndex(emp => emp.id === id);
      if (index !== -1) {
        employees[index] = { ...employees[index], ...data, updatedAt: new Date() };
        return employees[index];
      }
      return null;
    },
    delete: async (id) => {
      const index = employees.findIndex(emp => emp.id === id);
      if (index !== -1) {
        return employees.splice(index, 1)[0];
      }
      return null;
    }
  },

  // Building Management
  buildings: {
    findAll: async () => buildings,
    findById: async (id) => buildings.find(bld => bld.id === id),
    create: async (data) => {
      const building = { id: generateId(), ...data, createdAt: new Date() };
      buildings.push(building);
      return building;
    },
    update: async (id, data) => {
      const index = buildings.findIndex(bld => bld.id === id);
      if (index !== -1) {
        buildings[index] = { ...buildings[index], ...data };
        return buildings[index];
      }
      return null;
    }
  },

  // Floor Management
  floors: {
    findAll: async (buildingId) => {
      return buildingId ? floors.filter(flr => flr.buildingId === buildingId) : floors;
    },
    findById: async (id) => floors.find(flr => flr.id === id),
    create: async (data) => {
      const floor = { id: generateId(), ...data };
      floors.push(floor);
      return floor;
    }
  },

  // Room Management
  rooms: {
    findAll: async (filters = {}) => {
      let result = rooms;
      if (filters.buildingId) result = result.filter(room => room.buildingId === filters.buildingId);
      if (filters.floorId) result = result.filter(room => room.floorId === filters.floorId);
      if (filters.type) result = result.filter(room => room.type === filters.type);
      if (filters.isBookable !== undefined) result = result.filter(room => room.isBookable === filters.isBookable);
      return result;
    },
    findById: async (id) => rooms.find(room => room.id === id),
    create: async (data) => {
      const room = { id: generateId(), ...data, createdAt: new Date() };
      rooms.push(room);
      return room;
    },
    update: async (id, data) => {
      const index = rooms.findIndex(room => room.id === id);
      if (index !== -1) {
        rooms[index] = { ...rooms[index], ...data };
        return rooms[index];
      }
      return null;
    }
  },

  // Booking Management
  bookings: {
    findAll: async (filters = {}) => {
      let result = bookings;
      if (filters.employeeId) result = result.filter(booking => booking.employeeId === filters.employeeId);
      if (filters.roomId) result = result.filter(booking => booking.roomId === filters.roomId);
      if (filters.status) result = result.filter(booking => booking.status === filters.status);
      if (filters.date) {
        const targetDate = new Date(filters.date).toDateString();
        result = result.filter(booking => 
          new Date(booking.startTime).toDateString() === targetDate
        );
      }
      return result.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    },
    findById: async (id) => bookings.find(booking => booking.id === id),
    create: async (data) => {
      const booking = {
        id: generateId(),
        ...data,
        status: data.status || 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      bookings.push(booking);
      return booking;
    },
    update: async (id, data) => {
      const index = bookings.findIndex(booking => booking.id === id);
      if (index !== -1) {
        bookings[index] = { ...bookings[index], ...data, updatedAt: new Date() };
        return bookings[index];
      }
      return null;
    },
    delete: async (id) => {
      const index = bookings.findIndex(booking => booking.id === id);
      if (index !== -1) {
        return bookings.splice(index, 1)[0];
      }
      return null;
    }
  },

  // Visitor Management
  visitors: {
    findAll: async (filters = {}) => {
      let result = visitors;
      if (filters.hostEmployeeId) result = result.filter(visitor => visitor.hostEmployeeId === filters.hostEmployeeId);
      if (filters.status) result = result.filter(visitor => visitor.status === filters.status);
      if (filters.visitDate) {
        const targetDate = new Date(filters.visitDate).toDateString();
        result = result.filter(visitor => 
          new Date(visitor.visitDate).toDateString() === targetDate
        );
      }
      return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    findById: async (id) => visitors.find(visitor => visitor.id === id),
    create: async (data) => {
      const visitor = {
        id: generateId(),
        ...data,
        status: data.status || 'scheduled',
        securityApproval: 'pending',
        createdAt: new Date()
      };
      visitors.push(visitor);
      return visitor;
    },
    update: async (id, data) => {
      const index = visitors.findIndex(visitor => visitor.id === id);
      if (index !== -1) {
        visitors[index] = { ...visitors[index], ...data };
        return visitors[index];
      }
      return null;
    }
  },

  // Asset Management
  assets: {
    findAll: async (filters = {}) => {
      let result = assets;
      if (filters.category) result = result.filter(asset => asset.category === filters.category);
      if (filters.status) result = result.filter(asset => asset.status === filters.status);
      if (filters.assignedTo) result = result.filter(asset => asset.assignedTo === filters.assignedTo);
      return result;
    },
    findById: async (id) => assets.find(asset => asset.id === id),
    findByAssetTag: async (tag) => assets.find(asset => asset.assetTag === tag),
    create: async (data) => {
      const asset = {
        id: generateId(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      assets.push(asset);
      return asset;
    },
    update: async (id, data) => {
      const index = assets.findIndex(asset => asset.id === id);
      if (index !== -1) {
        assets[index] = { ...assets[index], ...data, updatedAt: new Date() };
        return assets[index];
      }
      return null;
    }
  },

  // Department Management
  departments: {
    findAll: async () => departments,
    findById: async (id) => departments.find(dept => dept.id === id),
    create: async (data) => {
      const department = { id: generateId(), ...data, createdAt: new Date() };
      departments.push(department);
      return department;
    }
  },

  // Attendance Management
  attendance: {
    findAll: async (filters = {}) => {
      let result = attendance;
      if (filters.employeeId) result = result.filter(att => att.employeeId === filters.employeeId);
      if (filters.date) {
        const targetDate = new Date(filters.date).toDateString();
        result = result.filter(att => new Date(att.date).toDateString() === targetDate);
      }
      return result;
    },
    create: async (data) => {
      const record = {
        id: generateId(),
        ...data,
        createdAt: new Date()
      };
      attendance.push(record);
      return record;
    }
  },

  // Leave Management
  leaves: {
    findAll: async (filters = {}) => {
      let result = leaves;
      if (filters.employeeId) result = result.filter(leave => leave.employeeId === filters.employeeId);
      if (filters.status) result = result.filter(leave => leave.status === filters.status);
      return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    findById: async (id) => leaves.find(leave => leave.id === id),
    create: async (data) => {
      const leave = {
        id: generateId(),
        ...data,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      leaves.push(leave);
      return leave;
    },
    update: async (id, data) => {
      const index = leaves.findIndex(leave => leave.id === id);
      if (index !== -1) {
        leaves[index] = { ...leaves[index], ...data, updatedAt: new Date() };
        return leaves[index];
      }
      return null;
    }
  },

  // Notification Management
  notifications: {
    findAll: async (filters = {}) => {
      let result = notifications;
      if (filters.recipientId) {
        result = result.filter(notif => 
          notif.recipients.includes(filters.recipientId) || notif.recipientType === 'all'
        );
      }
      return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    create: async (data) => {
      const notification = {
        id: generateId(),
        ...data,
        status: 'sent',
        sentAt: new Date(),
        readBy: [],
        createdAt: new Date()
      };
      notifications.push(notification);
      return notification;
    }
  },

  // Settings Management
  settings: {
    getAll: async () => {
      return systemSettings;
    },
    getCategory: async (category) => {
      return systemSettings[category] || null;
    },
    updateCategory: async (category, items) => {
      systemSettings[category] = items;
      return systemSettings[category];
    },
    initialize: async (defaultSettings) => {
      systemSettings = { ...defaultSettings };
      return systemSettings;
    }
  }
};

// System settings storage
let systemSettings = {};

module.exports = enterpriseDb;
