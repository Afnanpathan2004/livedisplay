// User roles
const ROLES = {
  ADMIN: 'admin',
  HR: 'hr',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  SECURITY: 'security',
  MAINTENANCE: 'maintenance'
};

// Permissions for role-based access control
const PERMISSIONS = {
  // Schedule permissions
  READ_SCHEDULES: 'read_schedules',
  CREATE_SCHEDULES: 'create_schedules',
  UPDATE_SCHEDULES: 'update_schedules',
  DELETE_SCHEDULES: 'delete_schedules',
  
  // Announcement permissions
  READ_ANNOUNCEMENTS: 'read_announcements',
  CREATE_ANNOUNCEMENTS: 'create_announcements',
  UPDATE_ANNOUNCEMENTS: 'update_announcements',
  DELETE_ANNOUNCEMENTS: 'delete_announcements',
  
  // Task permissions
  READ_TASKS: 'read_tasks',
  CREATE_TASKS: 'create_tasks',
  UPDATE_TASKS: 'update_tasks',
  DELETE_TASKS: 'delete_tasks',
  
  // Employee permissions
  READ_EMPLOYEES: 'read_employees',
  CREATE_EMPLOYEES: 'create_employees',
  UPDATE_EMPLOYEES: 'update_employees',
  DELETE_EMPLOYEES: 'delete_employees',
  
  // Room booking permissions
  READ_BOOKINGS: 'read_bookings',
  CREATE_BOOKINGS: 'create_bookings',
  UPDATE_BOOKINGS: 'update_bookings',
  DELETE_BOOKINGS: 'delete_bookings',
  APPROVE_BOOKINGS: 'approve_bookings',
  
  // Visitor permissions
  READ_VISITORS: 'read_visitors',
  CREATE_VISITORS: 'create_visitors',
  UPDATE_VISITORS: 'update_visitors',
  DELETE_VISITORS: 'delete_visitors',
  APPROVE_VISITORS: 'approve_visitors',
  
  // Asset permissions
  READ_ASSETS: 'read_assets',
  CREATE_ASSETS: 'create_assets',
  UPDATE_ASSETS: 'update_assets',
  DELETE_ASSETS: 'delete_assets',
  
  // Attendance permissions
  READ_ATTENDANCE: 'read_attendance',
  MARK_ATTENDANCE: 'mark_attendance',
  UPDATE_ATTENDANCE: 'update_attendance',
  
  // Leave permissions
  READ_LEAVES: 'read_leaves',
  CREATE_LEAVES: 'create_leaves',
  UPDATE_LEAVES: 'update_leaves',
  APPROVE_LEAVES: 'approve_leaves',
  
  // Notification permissions
  READ_NOTIFICATIONS: 'read_notifications',
  CREATE_NOTIFICATIONS: 'create_notifications',
  DELETE_NOTIFICATIONS: 'delete_notifications',
  
  // Admin permissions
  MANAGE_USERS: 'manage_users',
  VIEW_REPORTS: 'view_reports',
  SYSTEM_CONFIG: 'system_config'
};

// Role-based permission mapping
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // All permissions for admin
    ...Object.values(PERMISSIONS)
  ],
  
  [ROLES.HR]: [
    // Schedule permissions
    PERMISSIONS.READ_SCHEDULES,
    PERMISSIONS.CREATE_SCHEDULES,
    PERMISSIONS.UPDATE_SCHEDULES,
    PERMISSIONS.DELETE_SCHEDULES,
    
    // Announcement permissions
    PERMISSIONS.READ_ANNOUNCEMENTS,
    PERMISSIONS.CREATE_ANNOUNCEMENTS,
    PERMISSIONS.UPDATE_ANNOUNCEMENTS,
    PERMISSIONS.DELETE_ANNOUNCEMENTS,
    
    // Employee permissions
    PERMISSIONS.READ_EMPLOYEES,
    PERMISSIONS.CREATE_EMPLOYEES,
    PERMISSIONS.UPDATE_EMPLOYEES,
    
    // Booking permissions
    PERMISSIONS.READ_BOOKINGS,
    PERMISSIONS.CREATE_BOOKINGS,
    PERMISSIONS.UPDATE_BOOKINGS,
    PERMISSIONS.APPROVE_BOOKINGS,
    
    // Visitor permissions
    PERMISSIONS.READ_VISITORS,
    PERMISSIONS.CREATE_VISITORS,
    PERMISSIONS.UPDATE_VISITORS,
    PERMISSIONS.APPROVE_VISITORS,
    
    // Asset permissions
    PERMISSIONS.READ_ASSETS,
    PERMISSIONS.CREATE_ASSETS,
    PERMISSIONS.UPDATE_ASSETS,
    
    // Attendance permissions
    PERMISSIONS.READ_ATTENDANCE,
    PERMISSIONS.UPDATE_ATTENDANCE,
    
    // Leave permissions
    PERMISSIONS.READ_LEAVES,
    PERMISSIONS.APPROVE_LEAVES,
    
    // Notification permissions
    PERMISSIONS.READ_NOTIFICATIONS,
    PERMISSIONS.CREATE_NOTIFICATIONS,
    
    // Reports
    PERMISSIONS.VIEW_REPORTS
  ],
  
  [ROLES.MANAGER]: [
    // Schedule permissions
    PERMISSIONS.READ_SCHEDULES,
    PERMISSIONS.CREATE_SCHEDULES,
    PERMISSIONS.UPDATE_SCHEDULES,
    
    // Announcement permissions
    PERMISSIONS.READ_ANNOUNCEMENTS,
    PERMISSIONS.CREATE_ANNOUNCEMENTS,
    
    // Task permissions
    PERMISSIONS.READ_TASKS,
    PERMISSIONS.CREATE_TASKS,
    PERMISSIONS.UPDATE_TASKS,
    PERMISSIONS.DELETE_TASKS,
    
    // Employee permissions (limited)
    PERMISSIONS.READ_EMPLOYEES,
    
    // Booking permissions
    PERMISSIONS.READ_BOOKINGS,
    PERMISSIONS.CREATE_BOOKINGS,
    PERMISSIONS.UPDATE_BOOKINGS,
    PERMISSIONS.APPROVE_BOOKINGS,
    
    // Visitor permissions
    PERMISSIONS.READ_VISITORS,
    PERMISSIONS.CREATE_VISITORS,
    PERMISSIONS.APPROVE_VISITORS,
    
    // Asset permissions (limited)
    PERMISSIONS.READ_ASSETS,
    
    // Attendance permissions
    PERMISSIONS.READ_ATTENDANCE,
    
    // Leave permissions
    PERMISSIONS.READ_LEAVES,
    PERMISSIONS.APPROVE_LEAVES,
    
    // Notification permissions
    PERMISSIONS.READ_NOTIFICATIONS,
    PERMISSIONS.CREATE_NOTIFICATIONS
  ],
  
  [ROLES.EMPLOYEE]: [
    // Schedule permissions
    PERMISSIONS.READ_SCHEDULES,
    
    // Announcement permissions
    PERMISSIONS.READ_ANNOUNCEMENTS,
    
    // Task permissions
    PERMISSIONS.READ_TASKS,
    PERMISSIONS.CREATE_TASKS,
    PERMISSIONS.UPDATE_TASKS,
    
    // Employee permissions (own profile)
    PERMISSIONS.READ_EMPLOYEES,
    
    // Booking permissions
    PERMISSIONS.READ_BOOKINGS,
    PERMISSIONS.CREATE_BOOKINGS,
    PERMISSIONS.UPDATE_BOOKINGS,
    
    // Visitor permissions
    PERMISSIONS.READ_VISITORS,
    PERMISSIONS.CREATE_VISITORS,
    
    // Asset permissions (view only)
    PERMISSIONS.READ_ASSETS,
    
    // Attendance permissions
    PERMISSIONS.READ_ATTENDANCE,
    PERMISSIONS.MARK_ATTENDANCE,
    
    // Leave permissions
    PERMISSIONS.READ_LEAVES,
    PERMISSIONS.CREATE_LEAVES,
    
    // Notification permissions
    PERMISSIONS.READ_NOTIFICATIONS
  ],
  
  [ROLES.SECURITY]: [
    // Visitor permissions
    PERMISSIONS.READ_VISITORS,
    PERMISSIONS.UPDATE_VISITORS,
    PERMISSIONS.APPROVE_VISITORS,
    
    // Asset permissions (security related)
    PERMISSIONS.READ_ASSETS,
    
    // Notification permissions
    PERMISSIONS.READ_NOTIFICATIONS,
    
    // Employee permissions (limited)
    PERMISSIONS.READ_EMPLOYEES
  ],
  
  [ROLES.MAINTENANCE]: [
    // Asset permissions
    PERMISSIONS.READ_ASSETS,
    PERMISSIONS.UPDATE_ASSETS,
    
    // Notification permissions
    PERMISSIONS.READ_NOTIFICATIONS,
    
    // Attendance permissions
    PERMISSIONS.MARK_ATTENDANCE
  ]
};

// Status constants
const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

// Priority levels
const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Leave types
const LEAVE_TYPES = {
  CASUAL: 'casual',
  SICK: 'sick',
  EARNED: 'earned',
  MATERNITY: 'maternity',
  PATERNITY: 'paternity',
  EMERGENCY: 'emergency'
};

// Asset categories
const ASSET_CATEGORIES = {
  LAPTOP: 'laptop',
  DESKTOP: 'desktop',
  MONITOR: 'monitor',
  PHONE: 'phone',
  FURNITURE: 'furniture',
  VEHICLE: 'vehicle',
  OTHER: 'other'
};

// Notification types
const NOTIFICATION_TYPES = {
  BOOKING: 'booking',
  VISITOR: 'visitor',
  ASSET: 'asset',
  LEAVE: 'leave',
  ATTENDANCE: 'attendance',
  ANNOUNCEMENT: 'announcement',
  SYSTEM: 'system'
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  STATUS,
  PRIORITY,
  LEAVE_TYPES,
  ASSET_CATEGORIES,
  NOTIFICATION_TYPES
};
